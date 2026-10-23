const accessKeysCache = new Map();
const ACCESS_KEYS_CACHE_MS = 5 * 60 * 1000;
const ACCESS_DENIED = { detail: "Acesso não autorizado." };

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJsonSegment(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

async function getAccessKeys(teamDomain) {
  const cached = accessKeysCache.get(teamDomain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const keysUrl = new URL("/cdn-cgi/access/certs", teamDomain);
  const response = await fetch(keysUrl, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Cloudflare Access signing keys are unavailable.");
  }

  const keySet = await response.json();
  if (!Array.isArray(keySet.keys)) {
    throw new Error("Cloudflare Access returned an invalid key set.");
  }

  accessKeysCache.set(teamDomain, {
    keys: keySet.keys,
    expiresAt: Date.now() + ACCESS_KEYS_CACHE_MS,
  });
  return keySet.keys;
}

async function validateAccessRequest(request, env) {
  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || "").replace(/\/+$/, "");
  const expectedAudience = String(env.ACCESS_AUDIENCE || "");
  const organizerEmail = String(env.ORGANIZER_EMAIL || "").trim().toLowerCase();

  if (!teamDomain || !expectedAudience || !organizerEmail) {
    return { status: 503, body: { detail: "A proteção do organizador não está configurada." } };
  }

  let teamUrl;
  try {
    teamUrl = new URL(teamDomain);
  } catch {
    return { status: 503, body: { detail: "A proteção do organizador não está configurada." } };
  }

  if (teamUrl.protocol !== "https:" || teamUrl.origin !== teamDomain) {
    return { status: 503, body: { detail: "A proteção do organizador não está configurada." } };
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || token.length > 16384) {
    return { status: 401, body: ACCESS_DENIED };
  }

  const segments = token.split(".");
  if (segments.length !== 3) {
    return { status: 401, body: ACCESS_DENIED };
  }

  let header;
  let claims;
  let signature;
  try {
    [header, claims, signature] = [
      decodeJsonSegment(segments[0]),
      decodeJsonSegment(segments[1]),
      decodeBase64Url(segments[2]),
    ];
  } catch {
    return { status: 401, body: ACCESS_DENIED };
  }

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  if (
    header.alg !== "RS256"
    || !header.kid
    || claims.iss !== teamDomain
    || !audiences.includes(expectedAudience)
    || email !== organizerEmail
    || !Number.isFinite(claims.exp)
    || claims.exp <= now
    || (Number.isFinite(claims.nbf) && claims.nbf > now)
  ) {
    return { status: 401, body: ACCESS_DENIED };
  }

  let signingKey;
  try {
    const keys = await getAccessKeys(teamDomain);
    const jwk = keys.find((key) => key.kid === header.kid && key.alg === "RS256");
    if (!jwk) {
      return { status: 401, body: ACCESS_DENIED };
    }

    signingKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return { status: 503, body: { detail: "Não foi possível validar a sessão do organizador." } };
  }

  try {
    const signedContent = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
    const validSignature = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      signingKey,
      signature,
      signedContent,
    );
    return validSignature
      ? { status: 200 }
      : { status: 401, body: ACCESS_DENIED };
  } catch {
    return { status: 401, body: ACCESS_DENIED };
  }
}

export async function onRequestGet(context) {
  const authorization = await validateAccessRequest(context.request, context.env);
  if (authorization.status !== 200) {
    return jsonResponse(authorization.body, authorization.status);
  }

  const slug = String(context.params.slug || "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return jsonResponse({ detail: "Evento não encontrado." }, 404);
  }

  const apiBaseUrl = String(context.env.RSVP_API_BASE_URL || "").trim();
  const organizerApiKey = String(context.env.ORGANIZER_API_KEY || "");
  if (organizerApiKey.length < 32) {
    return jsonResponse({ detail: "A consulta do organizador não está configurada." }, 503);
  }

  let apiUrl;
  try {
    apiUrl = new URL(apiBaseUrl);
  } catch {
    return jsonResponse({ detail: "A consulta do organizador não está configurada." }, 503);
  }
  if (apiUrl.protocol !== "https:" || apiUrl.origin !== apiBaseUrl) {
    return jsonResponse({ detail: "A consulta do organizador não está configurada." }, 503);
  }

  const endpoint = new URL(
    `/api/admin/events/${encodeURIComponent(slug)}/rsvps`,
    apiUrl,
  );

  let upstream;
  let records;
  try {
    upstream = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Organizer-Key": organizerApiKey,
      },
      cache: "no-store",
      redirect: "error",
    });

    if (upstream.ok) {
      records = await upstream.json();
    }
  } catch (error) {
    const sanitizeMessage = (message) => String(message)
      .replaceAll(organizerApiKey, "[redacted]")
      .slice(0, 160);
    const cause = error instanceof Error && error.cause instanceof Error
      ? error.cause
      : null;
    console.error("Organizer RSVP proxy upstream failure", {
      stage: upstream ? "parse" : "fetch",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? sanitizeMessage(error.message) : "Unknown error",
      causeName: cause?.name ?? null,
      causeMessage: cause ? sanitizeMessage(cause.message) : null,
      upstreamStatus: upstream?.status ?? null,
    });
    return jsonResponse({ detail: "Serviço de confirmações indisponível." }, 502);
  }

  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502;
    const detail = status === 404
      ? "Evento não encontrado."
      : "Não foi possível carregar as confirmações.";
    return jsonResponse({ detail }, status);
  }

  if (!Array.isArray(records)) {
    return jsonResponse({ detail: "Resposta inválida do serviço de confirmações." }, 502);
  }

  return jsonResponse(records, 200);
}
