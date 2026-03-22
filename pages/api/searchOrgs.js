import {
  buildOrganizationSearchTerms,
  diavgeiaUrl,
  fetchWithTimeout,
  rankOrganizations
} from '../../lib/diavgeia';

const SEARCH_LIMIT = 40;

function mapOrg(org) {
  return {
    uid: org.uid,
    title: org.title,
    afm: org.afm || '',
    score: org.score || 0
  };
}

async function fetchOrganizations(searchTerm) {
  const url = diavgeiaUrl('/orgs', {
    searchTerm,
    sortColumn: 'title',
    sortType: 'asc',
    limit: SEARCH_LIMIT,
    offset: 0
  });

  const payload = await fetchWithTimeout(url, 9000);
  return Array.isArray(payload.items) ? payload.items : [];
}

function dedupeOrganizations(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.uid || item.title;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const term = String(req.query.term || '').trim();

  if (!term) {
    return res.status(400).json({ error: 'Missing query parameter: term' });
  }

  try {
    const searchTerms = buildOrganizationSearchTerms(term);
    const primaryOrganizations = await fetchOrganizations(searchTerms[0] || term);
    let organizations = primaryOrganizations;

    const primaryRanked = rankOrganizations(primaryOrganizations, term);
    const shouldExpandSearch =
      searchTerms.length > 1 && (!primaryRanked.length || (primaryRanked[0]?.score || 0) < 100);

    if (shouldExpandSearch) {
      const extraSearches = await Promise.allSettled(
        searchTerms.slice(1).map((searchTerm) => fetchOrganizations(searchTerm))
      );

      organizations = dedupeOrganizations([
        ...primaryOrganizations,
        ...extraSearches.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      ]);
    }

    const ranked = rankOrganizations(organizations, term);
    const results = (ranked.length ? ranked : organizations)
      .slice(0, 10)
      .map(mapOrg);

    return res.status(200).json({
      term,
      source: 'live',
      selected: results[0] || null,
      results
    });
  } catch (error) {
    return res.status(502).json({
      error: `Αποτυχία σύνδεσης με Diavgeia: ${error.message}`
    });
  }
}
