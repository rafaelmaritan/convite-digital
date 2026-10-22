const config = window.invitationConfig;
const connectionStatus = document.querySelector('#connection-status');
const responseCount = document.querySelector('#response-count');
const responsesMessage = document.querySelector('#responses-message');
const responsesList = document.querySelector('#responses-list');
const summaryValues = {
  confirmed: document.querySelector('[data-total="confirmed"]'),
  people: document.querySelector('[data-total="people"]'),
  adults: document.querySelector('[data-total="adults"]'),
  children: document.querySelector('[data-total="children"]'),
  declined: document.querySelector('[data-total="declined"]'),
};

function addCell(row, label, value, className = '') {
  const cell = document.createElement('td');
  if (className) {
    cell.className = className;
  }
  cell.dataset.label = label;
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function formatSubmissionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderRecords(records) {
  const confirmed = records.filter((record) => record.attending);
  const declined = records.filter((record) => !record.attending);
  const totals = {
    confirmed: confirmed.length,
    people: confirmed.reduce((sum, record) => sum + record.adults + record.children, 0),
    adults: confirmed.reduce((sum, record) => sum + record.adults, 0),
    children: confirmed.reduce((sum, record) => sum + record.children, 0),
    declined: declined.length,
  };

  Object.entries(totals).forEach(([key, value]) => {
    summaryValues[key].textContent = String(value);
  });

  responseCount.textContent = `${records.length} ${records.length === 1 ? 'resposta' : 'respostas'}`;
  responsesList.replaceChildren();

  for (const record of records) {
    const row = document.createElement('tr');
    addCell(row, 'Nome', record.name, 'responses__name');

    const statusCell = addCell(
      row,
      'Resposta',
      record.attending ? 'Confirmou' : 'Não poderá ir',
      record.attending ? 'responses__status responses__status--confirmed' : 'responses__status responses__status--declined',
    );
    statusCell.setAttribute('aria-label', `Resposta: ${statusCell.textContent}`);

    addCell(row, 'Adultos', String(record.adults));
    addCell(row, 'Crianças', String(record.children));
    addCell(row, 'Enviada em', formatSubmissionDate(record.created_at));
    addCell(row, 'Observação', record.message || '—', 'responses__note');
    responsesList.append(row);
  }

  responsesMessage.textContent = records.length === 0
    ? 'Ainda não há confirmações para este evento.'
    : 'Totais de presença consideram somente quem confirmou.';
}

async function loadResponses() {
  connectionStatus.textContent = 'Carregando respostas...';
  connectionStatus.dataset.state = 'loading';

  try {
    const endpoint = new URL(
      `/api/admin/events/${encodeURIComponent(config.eventSlug)}/rsvps`,
      window.location.origin,
    );
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Acesse esta página pela sua conta autorizada do organizador.');
    }
    if (!response.ok) {
      throw new Error('Não foi possível carregar as confirmações agora.');
    }

    const records = await response.json();
    if (!Array.isArray(records)) {
      throw new Error('A resposta recebida está em um formato inválido.');
    }

    renderRecords(records);
    connectionStatus.textContent = 'Dados atualizados';
    connectionStatus.dataset.state = 'ready';
  } catch (error) {
    connectionStatus.textContent = 'Não foi possível carregar as respostas';
    connectionStatus.dataset.state = 'error';
    responsesMessage.textContent = error instanceof TypeError
      ? 'Não foi possível conectar ao serviço. Recarregue a página em alguns instantes.'
      : error.message;
    responseCount.textContent = 'indisponível';
    responsesList.replaceChildren();
    Object.values(summaryValues).forEach((element) => {
      element.textContent = '—';
    });
  }
}

loadResponses();
