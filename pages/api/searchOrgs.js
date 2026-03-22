import { diavgeiaUrl, fetchWithTimeout, rankOrganizations } from '../../lib/diavgeia';
import { findMockOrganizations } from '../../lib/mockData';

function mapOrg(org) {
  return {
    uid: org.uid,
    title: org.title,
    afm: org.afm || '',
    score: org.score || 0
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const term = String(req.query.term || '').trim();
  const forceMock = req.query.mock === '1' || req.query.mock === 'true';

  if (!term) {
    return res.status(400).json({ error: 'Missing query parameter: term' });
  }

  let source = 'live';
  let fallbackReason = null;
  let organizations = [];

  try {
    if (forceMock) {
      throw new Error('Forced mock mode requested');
    }

    // Fetch candidate organizations from Diavgeia using the search term.
    const url = diavgeiaUrl('/orgs', {
      searchTerm: term,
      sortColumn: 'title',
      sortType: 'asc',
      limit: 40,
      offset: 0
    });

    const payload = await fetchWithTimeout(url, 9000);
    organizations = Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    source = 'mock';
    fallbackReason = error.message;
  }

  if (!organizations.length) {
    source = 'mock';

    // Mock fallback keeps the UI testable when Diavgeia is unavailable.
    organizations = findMockOrganizations(term, 12);
    if (!fallbackReason && !organizations.length) {
      fallbackReason = 'No organizations found from live API';
    }
  }

  const ranked = rankOrganizations(organizations, term);
  const results = (ranked.length ? ranked : organizations)
    .slice(0, 10)
    .map(mapOrg);

  return res.status(200).json({
    term,
    source,
    fallbackReason,
    selected: results[0] || null,
    results
  });
}
