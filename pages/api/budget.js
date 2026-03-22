import {
  buildBudgetSummary,
  diavgeiaUrl,
  findFallbackStatement,
  findStatementByYear,
  fetchWithTimeout,
  getStatementYears,
  normalizeSpendingItem,
  parseAmount,
  sortStatements
} from '../../lib/diavgeia';

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

function isTruthy(value) {
  return ['1', 'true', 'yes'].includes(String(value || '').trim().toLowerCase());
}

async function fetchSpendingStatements(uid) {
  const url = diavgeiaUrl('/statements', {
    org_uid: uid,
    is_spending: 1,
    limit: 0
  });

  const payload = await fetchWithTimeout(url, 9000);
  return Array.isArray(payload.items) ? payload.items : [];
}

async function fetchLiveSpendings(statementUid) {
  const allItems = [];
  let reportedCount = 0;
  let reportedSum = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const offset = page * PAGE_LIMIT;
    const url = diavgeiaUrl('/spending_revisions', {
      is_published: 1,
      statement_uid: statementUid,
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
  const strictYear = isTruthy(req.query.strictYear);

  if (!uid || !year) {
    return res.status(400).json({ error: 'Missing query parameters: uid and year are required' });
  }

  try {
    const statements = sortStatements(await fetchSpendingStatements(uid));
    const availableYears = getStatementYears(statements);

    if (!statements.length) {
      return res.status(404).json({
        error: 'Δεν βρέθηκαν δημοσιευμένες δηλώσεις δαπανών για τον επιλεγμένο φορέα.',
        uid,
        orgTitle,
        requestedYear: year,
        resolvedYear: null,
        availableYears,
        source: 'live'
      });
    }

    let statement = findStatementByYear(statements, year);
    let usedFallbackYear = false;

    if (!statement) {
      if (strictYear) {
        return res.status(409).json({
          error: `Δεν υπάρχουν δημοσιευμένες δαπάνες για το ${year}.`,
          uid,
          orgTitle,
          requestedYear: year,
          resolvedYear: null,
          availableYears,
          source: 'live'
        });
      }

      statement = findFallbackStatement(statements, year);
      usedFallbackYear = Boolean(statement && String(statement.year || '') !== year);
    }

    if (!statement) {
      return res.status(404).json({
        error: 'Δεν κατέστη δυνατή η επιλογή δημοσιευμένης δήλωσης δαπανών.',
        uid,
        orgTitle,
        requestedYear: year,
        resolvedYear: null,
        availableYears,
        source: 'live'
      });
    }

    const live = await fetchLiveSpendings(statement.uid);
    const rawItems = live.items;
    const reportedSum = live.reportedSum;

    const resolvedYear = String(statement.year || year);
    const normalizedRecords = rawItems.map((item, index) => {
      const normalizedItem = normalizeSpendingItem(item, index);

      if (!normalizedItem.orgTitle) {
        normalizedItem.orgTitle = orgTitle;
      }

      return normalizedItem;
    });
    const summary = buildBudgetSummary(normalizedRecords);

    return res.status(200).json({
      uid,
      year: resolvedYear,
      requestedYear: year,
      resolvedYear,
      usedFallbackYear,
      availableYears,
      statementUid: statement.uid,
      statementTitle: statement.title || '',
      orgTitle: normalizedRecords[0]?.orgTitle || orgTitle,
      source: 'live',
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
  } catch (error) {
    return res.status(502).json({
      error: `Αποτυχία σύνδεσης με Diavgeia: ${error.message}`
    });
  }
}
