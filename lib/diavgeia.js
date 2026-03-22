const API_BASE = 'https://mef.diavgeia.gov.gr/api';

export function normalizeGreek(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .replace(/Σ/g, 'σ')
    .toUpperCase()
    .trim();
}

export function parseAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const raw = String(value).trim();
  const cleaned = raw
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchWithTimeout(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function scoreOrganization(title, term) {
  const normalizedTitle = normalizeGreek(title);
  const normalizedTerm = normalizeGreek(term);
  if (!normalizedTitle || !normalizedTerm) {
    return 0;
  }

  let score = 0;

  if (normalizedTitle === normalizedTerm) {
    score += 120;
  }

  if (normalizedTitle.startsWith(normalizedTerm)) {
    score += 65;
  }

  if (normalizedTitle.includes(normalizedTerm)) {
    score += 40;
  }

  if (normalizedTitle.includes(`ΔΗΜΟΣ ${normalizedTerm}`)) {
    score += 70;
  }

  if (normalizedTitle.includes('ΔΗΜΟΣ')) {
    score += 25;
  }

  const distancePenalty = Math.abs(normalizedTitle.length - normalizedTerm.length);
  score -= Math.min(distancePenalty, 18);

  return score;
}

export function rankOrganizations(items = [], term = '') {
  return items
    .map((item) => ({
      ...item,
      score: scoreOrganization(item.title, term)
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0);
}

export function inferCategory(item) {
  return (
    item.invoice_type ||
    item.subject ||
    item.reason ||
    item.category ||
    'Λοιπά / Other'
  );
}

export function normalizeDecisionUrl(decisions) {
  if (!decisions) {
    return '';
  }

  const firstDecision = String(decisions)
    .split(/[;,\s]+/)
    .find(Boolean);

  if (!firstDecision) {
    return '';
  }

  return `https://diavgeia.gov.gr/doc/${firstDecision}`;
}

export function normalizeSpendingItem(item = {}, index = 0) {
  const amount = parseAmount(item.amount);
  const vat = parseAmount(item.vat);
  const category = inferCategory(item);
  const payee = item.receiver_title || item.issuer_title || '';
  const decisionUrl = normalizeDecisionUrl(item.decisions);

  return {
    uid: item.uid || `${item.org_uid || 'row'}-${index}`,
    orgUid: item.org_uid || item['org.uid'] || '',
    orgTitle: item['org.title'] || item.org_title || '',
    date: item.date || '',
    year: item.year ? String(item.year) : '',
    amount,
    vat,
    category,
    title: item.subject || item.reason || item.invoice_type || 'Χωρίς τίτλο / Untitled',
    description: item.reason || item.subject || '',
    issuerTitle: item.issuer_title || '',
    receiverTitle: item.receiver_title || '',
    payee,
    invoiceType: item.invoice_type || '',
    decisionId: item.decisions || '',
    decisionUrl
  };
}

export function buildBudgetSummary(items = []) {
  const total = items.reduce((sum, item) => sum + parseAmount(item.amount), 0);

  const byCategory = items.reduce((acc, item) => {
    const category = item.category || 'Λοιπά / Other';
    const amount = parseAmount(item.amount);
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  return {
    total,
    recordCount: items.length,
    byCategory
  };
}

export function diavgeiaUrl(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return `${API_BASE}${path}?${searchParams.toString()}`;
}
