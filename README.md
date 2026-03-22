# Municipal Budget Dashboard (Next.js)

A Next.js (Pages Router) web app to compare annual spendings between two Greek municipalities using Diavgeia Open Data.

## Features

- Two municipality search inputs + year selector
- Compare workflow from text input to live data charts/tables
- Next.js API routes for upstream Diavgeia fetches
- Fallback to mock data when Diavgeia is unavailable or slow
- Reusable React components:
  - `CompareForm`
  - `BarChartComparison`
  - `PieChartComparison`
  - `BudgetTableComparison`

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open:

- Home page: `http://localhost:3000/`
- Compare page example: `http://localhost:3000/compare?m1=%CE%A3%CE%B1%CE%BB%CE%B1%CE%BC%CE%AF%CE%BD%CE%B1&m2=%CE%9A%CE%B1%CE%BB%CE%BB%CE%B9%CE%B8%CE%AD%CE%B1&year=2024`

## Build

```bash
npm run build
```

## Backend API Routes

### `GET /api/searchOrgs?term=<text>`

Looks up organizations by municipality search text.

Example:

```bash
curl "http://localhost:3000/api/searchOrgs?term=%CE%A3%CE%B1%CE%BB%CE%B1%CE%BC%CE%AF%CE%BD%CE%B1"
```

Example response:

```json
{
  "term": "Σαλαμίνα",
  "source": "live",
  "fallbackReason": null,
  "selected": {
    "uid": "2feba214-c61b-4a89-a5b6-8fa7190d01ea",
    "title": "ΔΗΜΟΣ ΣΑΛΑΜΙΝΑΣ",
    "afm": "090035241",
    "score": 132
  },
  "results": [
    {
      "uid": "2feba214-c61b-4a89-a5b6-8fa7190d01ea",
      "title": "ΔΗΜΟΣ ΣΑΛΑΜΙΝΑΣ",
      "afm": "090035241",
      "score": 132
    }
  ]
}
```

### `GET /api/budget?uid=<uid>&year=<year>`

Fetches spending records and summary for a municipality and year.

Example:

```bash
curl "http://localhost:3000/api/budget?uid=2feba214-c61b-4a89-a5b6-8fa7190d01ea&year=2024"
```

Example response:

```json
{
  "uid": "2feba214-c61b-4a89-a5b6-8fa7190d01ea",
  "year": "2024",
  "orgTitle": "ΔΗΜΟΣ ΣΑΛΑΜΙΝΑΣ",
  "source": "live",
  "fallbackReason": null,
  "reportedTotal": 0,
  "summary": {
    "total": 283421.12,
    "recordCount": 27,
    "byCategory": {
      "Καθαριότητα": 62000,
      "Υποδομές": 99000
    },
    "categories": [
      { "name": "Υποδομές", "amount": 99000 },
      { "name": "Καθαριότητα", "amount": 62000 }
    ]
  },
  "records": [
    {
      "uid": "2feba214-c61b-4a89-a5b6-8fa7190d01ea-0-0",
      "orgUid": "2feba214-c61b-4a89-a5b6-8fa7190d01ea",
      "orgTitle": "ΔΗΜΟΣ ΣΑΛΑΜΙΝΑΣ",
      "date": "08/02/2024",
      "year": "2024",
      "amount": 5120.34,
      "vat": 1228.88,
      "category": "Καθαριότητα",
      "title": "Δαπάνη για Καθαριότητα",
      "description": "Λειτουργικά έξοδα καθαριότητας",
      "issuerTitle": "...",
      "receiverTitle": "...",
      "payee": "...",
      "invoiceType": "Καθαριότητα",
      "decisionId": "ΑΒΓ123",
      "decisionUrl": "https://diavgeia.gov.gr/doc/ΑΒΓ123"
    }
  ],
  "lastUpdated": "2026-03-02T12:34:56.000Z"
}
```

## Upstream Diavgeia endpoints used

- `https://mef.diavgeia.gov.gr/api/orgs?searchTerm=<text>`
- `https://mef.diavgeia.gov.gr/api/spendings?org_uid=<uid>&year=<year>`

The backend routes implement timeout handling and fallback mock data so the app remains usable.
