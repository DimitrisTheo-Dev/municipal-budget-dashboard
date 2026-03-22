import {
  buildBudgetSummary,
  diavgeiaUrl,
  fetchWithTimeout,
  normalizeSpendingItem,
  parseAmount
} from '../../lib/diavgeia';
import { createMockSpendings } from '../../lib/mockData';

const PAGE_LIMIT = 200;
const MAX_PAGES = 6;

function categoryArray(byCategory) {
  return Object.entries(byCategory)
    .map(([name, amount]) => ({
      name,
      amount: Number(amount.toFixed(2))
    }))
    .sort((a, b) => b.amount - a.amount);
}

async function fetchLiveSpendings(uid, year) {
  const allItems = [];
  let reportedCount = 0;
  let reportedSum = 0;

  // Basic pagination loop in case Diavgeia returns partial pages.
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const offset = page * PAGE_LIMIT;
    const url = diavgeiaUrl('/spendings', {
      org_uid: uid,
      year,
      sortColumn: 'date',
      sortType: 'desc',
      limit: PAGE_LIMIT,
      offset
    });

    const payload = await fetchWithTimeout(url, 9000);
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!reportedCount && payload.count) {
      reportedCount = Number.parseInt(payload.count, 10) || 0;
    }

    if (!reportedSum && payload.sum) {
      reportedSum = parseAmount(payload.sum);
    }

    allItems.push(...items);

    if (!items.length || items.length < PAGE_LIMIT) {
      break;
    }

    if (reportedCount > 0 && allItems.length >= reportedCount) {
      break;
    }
  }

  return {
    items: allItems,
    reportedCount,
    reportedSum
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = String(req.query.uid || '').trim();
  const year = String(req.query.year || '').trim();
  const orgTitle = String(req.query.orgTitle || 'ΔΗΜΟΣ').trim();
  const forceMock = req.query.mock === '1' || req.query.mock === 'true';

  if (!uid || !year) {
    return res.status(400).json({ error: 'Missing query parameters: uid and year are required' });
  }

  let source = 'live';
  let fallbackReason = null;
  let rawItems = [];
  let reportedSum = 0;

  try {
    if (forceMock) {
      throw new Error('Forced mock mode requested');
    }

    // Fetch spendings from Diavgeia using org UID and selected year.
    const live = await fetchLiveSpendings(uid, year);
    rawItems = live.items;
    reportedSum = live.reportedSum;
  } catch (error) {
    source = 'mock';
    fallbackReason = error.message;
  }

  if (!rawItems.length) {
    source = 'mock';

    // Use deterministic mock records so the UI works even when API is down.
    rawItems = createMockSpendings(uid, year, orgTitle);
    if (!fallbackReason && !rawItems.length) {
      fallbackReason = 'No records returned from live API';
    }
  }

  const normalizedRecords = rawItems.map((item, index) => normalizeSpendingItem(item, index));
  const summary = buildBudgetSummary(normalizedRecords);

  return res.status(200).json({
    uid,
    year,
    orgTitle: normalizedRecords[0]?.orgTitle || orgTitle,
    source,
    fallbackReason,
    reportedTotal: reportedSum,
    summary: {
      total: Number(summary.total.toFixed(2)),
      recordCount: summary.recordCount,
      byCategory: summary.byCategory,
      categories: categoryArray(summary.byCategory)
    },
    records: normalizedRecords,
    lastUpdated: new Date().toISOString()
  });
}
