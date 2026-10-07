const config = window.invitationConfig;
const deadlineParts = config.rsvpDeadline.split('-').map(Number);
const deadlineDate = new Date(deadlineParts[0], deadlineParts[1] - 1, deadlineParts[2], 12);
const deadlineElement = document.querySelector('#rsvp-deadline');
deadlineElement.textContent = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
}).format(deadlineDate);
deadlineElement.dateTime = config.rsvpDeadline;

document.querySelectorAll('.event-location-name').forEach((element) => {
  element.textContent = config.location.name;
});
document.querySelectorAll('.event-location-city').forEach((element) => {
  element.textContent = config.location.city;
});
document.querySelector('#event-address').textContent = `${config.location.address} · ${config.location.city}`;

const mapSearchUrl = new URL('https://www.google.com/maps/search/');
mapSearchUrl.searchParams.set('api', '1');
mapSearchUrl.searchParams.set(
  'query',
  `${config.location.name}, ${config.location.address}, ${config.location.city}`,
);
const mapLink = document.querySelector('[data-map-link]');
mapLink.href = mapSearchUrl.toString();
mapLink.setAttribute('aria-label', `Abrir ${config.location.name} no Google Maps`);

const eventDate = new Date('2026-12-05T15:00:00-03:00').getTime();
const countdownElements = {
  days: document.querySelector('[data-countdown="days"]'),
  hours: document.querySelector('[data-countdown="hours"]'),
  minutes: document.querySelector('[data-countdown="minutes"]'),
  seconds: document.querySelector('[data-countdown="seconds"]'),
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function updateCountdown() {
  const remaining = Math.max(eventDate - Date.now(), 0);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  countdownElements.days.textContent = pad(days);
  countdownElements.hours.textContent = pad(hours);
  countdownElements.minutes.textContent = pad(minutes);
  countdownElements.seconds.textContent = pad(seconds);
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const counts = {
  adults: 1,
  children: 0,
};
const minimums = {
  adults: 0,
  children: 0,
};
const maximums = {
  adults: 12,
  children: 12,
};
const helper = document.querySelector('#guest-helper');
const stepButtons = document.querySelectorAll('[data-step]');
const attendanceInputs = document.querySelectorAll('input[name="attendance"]');

function renderCount(type) {
  const valueElement = document.querySelector(`[data-value="${type}"]`);
  const stepper = document.querySelector(`[data-stepper="${type}"]`);
  const decreaseButton = stepper.querySelector('[data-direction="down"]');
  const increaseButton = stepper.querySelector('[data-direction="up"]');

  valueElement.textContent = counts[type];
  decreaseButton.disabled = counts[type] <= minimums[type];
  increaseButton.disabled = counts[type] >= maximums[type];
}

function updateAttendanceState() {
  const attending = document.querySelector('input[name="attendance"]:checked').value === 'yes';
  document.querySelectorAll('[data-stepper]').forEach((stepper) => {
    stepper.querySelectorAll('button').forEach((button) => {
      button.disabled = !attending;
    });
    stepper.style.opacity = attending ? '1' : '0.48';
  });

  helper.textContent = attending
    ? 'Você poderá ajustar as quantidades depois.'
    : 'Tudo bem. Obrigado por avisar, vamos sentir sua falta.';
}

stepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.step;
    const direction = button.dataset.direction === 'up' ? 1 : -1;
    counts[type] = Math.min(
      Math.max(counts[type] + direction, minimums[type]),
      maximums[type],
    );
    renderCount(type);
  });
});

attendanceInputs.forEach((input) => {
  input.addEventListener('change', updateAttendanceState);
});

renderCount('adults');
renderCount('children');
updateAttendanceState();

const portrait = document.querySelector('.photo-frame');
const portraitImage = portrait.querySelector('img');
portraitImage.addEventListener('error', () => {
  portrait.classList.add('photo-frame--fallback');
});

const form = document.querySelector('#rsvp-form');
const successPanel = document.querySelector('#success-panel');
const formError = document.querySelector('#rsvp-error');
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector('.button__label');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const attending = formData.get('attendance') === 'yes';
  const responseData = {
    name: String(formData.get('guest-name') || '').trim(),
    attending,
    adults: attending ? counts.adults : 0,
    children: attending ? counts.children : 0,
    message: String(formData.get('guest-note') || '').trim() || null,
    website: String(formData.get('website') || '').trim(),
  };

  formError.hidden = true;
  form.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitLabel.textContent = 'Enviando...';

  try {
    const apiUrl = new URL(
      `/api/events/${encodeURIComponent(config.eventSlug)}/rsvps`,
      config.apiBaseUrl,
    );
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.detail || 'Não conseguimos registrar sua resposta. Tente novamente.');
    }

    document.querySelector('#success-title').textContent = attending
      ? 'Presença confirmada.'
      : 'Resposta recebida.';
    document.querySelector('#success-message').textContent = attending
      ? 'Será uma alegria ter vocês conosco nessa tarde.'
      : 'Obrigado por avisar. Sentiremos sua falta nessa tarde.';
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
  } catch (error) {
    formError.textContent = error instanceof TypeError
      ? 'Não conseguimos conectar ao servidor. Verifique se o backend está em execução e tente novamente.'
      : error.message;
    formError.hidden = false;
  } finally {
    form.removeAttribute('aria-busy');
    submitButton.disabled = false;
    submitLabel.textContent = 'Enviar confirmação';
  }
});
