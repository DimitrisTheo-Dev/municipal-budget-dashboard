import { normalizeGreek, parseAmount } from './diavgeia';

export const MOCK_ORGS = [
  {
    uid: '2feba214-c61b-4a89-a5b6-8fa7190d01ea',
    title: 'ΔΗΜΟΣ ΣΑΛΑΜΙΝΑΣ',
    afm: '090035241'
  },
  {
    uid: '1df63ccb-fbaf-4c40-a4fe-e5a2f2b7d7ab',
    title: 'ΔΗΜΟΣ ΚΑΛΛΙΘΕΑΣ',
    afm: '090211861'
  },
  {
    uid: '44d414f9-635f-4d09-bfbb-0ac6e500f90d',
    title: 'ΔΗΜΟΣ ΑΘΗΝΑΙΩΝ',
    afm: '090025537'
  },
  {
    uid: 'ee62bd7b-558f-4f8b-a36b-7b7106b556f5',
    title: 'ΔΗΜΟΣ ΠΕΙΡΑΙΑ',
    afm: '090010051'
  },
  {
    uid: '838ce8f1-4ae8-4f1c-9668-7e53d8be3de5',
    title: 'ΔΗΜΟΣ ΘΕΣΣΑΛΟΝΙΚΗΣ',
    afm: '090187243'
  }
];

const CATEGORY_BASE = [
  { key: 'Καθαριότητα', amount: 68000 },
  { key: 'Υποδομές', amount: 92000 },
  { key: 'Κοινωνική Πολιτική', amount: 38000 },
  { key: 'Παιδεία', amount: 31000 },
  { key: 'Πολιτισμός', amount: 26000 },
  { key: 'Προμήθειες', amount: 54000 }
];

function hashText(value) {
  let hash = 0;
  const normalized = normalizeGreek(value);

  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function buildDecisionCode(uidHash, index) {
  const letters = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  const a = letters[(uidHash + index * 7) % letters.length];
  const b = letters[(uidHash + index * 11) % letters.length];
  const c = letters[(uidHash + index * 13) % letters.length];
  const serial = 100 + ((uidHash + index * 17) % 900);
  return `${a}${b}${c}${serial}`;
}

export function findMockOrganizations(term, limit = 8) {
  const normalizedTerm = normalizeGreek(term);

  if (!normalizedTerm) {
    return MOCK_ORGS.slice(0, limit);
  }

  const exact = [];
  const partial = [];

  MOCK_ORGS.forEach((org) => {
    const normalizedTitle = normalizeGreek(org.title);

    if (normalizedTitle === normalizedTerm || normalizedTitle.includes(`ΔΗΜΟΣ ${normalizedTerm}`)) {
      exact.push(org);
      return;
    }

    if (normalizedTitle.includes(normalizedTerm)) {
      partial.push(org);
    }
  });

  return [...exact, ...partial].slice(0, limit);
}

export function createMockSpendings(uid, year, orgTitle = 'ΔΗΜΟΣ') {
  const uidHash = hashText(`${uid}-${year}`);
  const yearNum = Number.parseInt(year, 10) || new Date().getFullYear();
  const monthOffset = (uidHash % 9) + 1;

  const records = CATEGORY_BASE.flatMap((category, categoryIndex) => {
    const count = 2 + ((uidHash + categoryIndex) % 3);

    return Array.from({ length: count }, (_, recordIndex) => {
      const factor = 0.78 + ((uidHash + categoryIndex * 5 + recordIndex * 3) % 45) / 100;
      const amount = Number((category.amount * factor).toFixed(2));
      const month = ((monthOffset + categoryIndex + recordIndex) % 12) + 1;
      const day = ((uidHash + categoryIndex * 9 + recordIndex * 6) % 27) + 1;
      const date = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${yearNum}`;
      const decisionId = buildDecisionCode(uidHash, categoryIndex * 3 + recordIndex);

      return {
        uid: `${uid}-${categoryIndex}-${recordIndex}`,
        org_uid: uid,
        'org.title': orgTitle,
        date,
        year: String(yearNum),
        amount: String(amount).replace('.', ','),
        vat: String((amount * 0.24).toFixed(2)).replace('.', ','),
        subject: `Δαπάνη για ${category.key}`,
        reason: `Λειτουργικά έξοδα ${category.key.toLowerCase()}`,
        invoice_type: category.key,
        issuer_title: `${orgTitle} - Προμηθευτής ${recordIndex + 1}`,
        receiver_title: `${orgTitle}`,
        decisions: decisionId
      };
    });
  });

  return records.sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
}
