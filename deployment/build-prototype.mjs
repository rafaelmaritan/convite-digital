import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const deploymentDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(deploymentDirectory, '..');
const prototypeDirectory = resolve(projectDirectory, 'prototype');
const outputDirectory = resolve(deploymentDirectory, 'dist');
const apiBaseUrl = process.env.PUBLIC_API_BASE_URL?.trim();

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Set ${name} before building the public invitation.`);
  }
  return value;
}

if (!apiBaseUrl) {
  throw new Error('Set PUBLIC_API_BASE_URL to the HTTPS URL of the deployed API.');
}

let apiUrl;
try {
  apiUrl = new URL(apiBaseUrl);
} catch {
  throw new Error('PUBLIC_API_BASE_URL must be a valid absolute URL.');
}

if (
  apiUrl.protocol !== 'https:'
  || apiUrl.username
  || apiUrl.password
  || apiUrl.pathname !== '/'
  || apiUrl.search
  || apiUrl.hash
) {
  throw new Error('PUBLIC_API_BASE_URL must be an HTTPS origin without credentials, path, query, or fragment.');
}

const eventSlug = requiredEnvironment('EVENT_SLUG');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(eventSlug)) {
  throw new Error('EVENT_SLUG must contain lowercase letters, numbers, and single hyphens.');
}

const rsvpDeadline = requiredEnvironment('EVENT_RSVP_DEADLINE');
const parsedDeadline = new Date(`${rsvpDeadline}T00:00:00Z`);
if (
  !/^\d{4}-\d{2}-\d{2}$/.test(rsvpDeadline)
  || Number.isNaN(parsedDeadline.valueOf())
  || parsedDeadline.toISOString().slice(0, 10) !== rsvpDeadline
) {
  throw new Error('EVENT_RSVP_DEADLINE must be a valid date in YYYY-MM-DD format.');
}

const eventConfig = {
  apiBaseUrl: apiUrl.origin,
  eventSlug,
  rsvpDeadline,
  location: {
    name: requiredEnvironment('EVENT_LOCATION'),
    address: requiredEnvironment('EVENT_ADDRESS'),
    city: requiredEnvironment('EVENT_CITY'),
  },
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(prototypeDirectory, outputDirectory, {
  recursive: true,
  filter: (sourcePath) => basename(sourcePath) !== 'event-config.js',
});
await writeFile(
  resolve(outputDirectory, 'event-config.js'),
  `window.invitationConfig = ${JSON.stringify(eventConfig, null, 2)};\n`,
  'utf8',
);

console.log(`Cloudflare Pages output generated at ${outputDirectory}`);
