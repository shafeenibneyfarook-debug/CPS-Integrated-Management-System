# CPS Integrated Contractor, Import & Export Management System — Frontend

A React.js + Tailwind CSS frontend created from the supplied Figma/screenshots for CSE471.

## Member page groups

### Person 1 — Tanmay
- Client Management List
- Add New Client
- Quotation Management List
- Create Quotation

### Person 2 — Rikum
- Supplier Management
- Add New Supplier
- Purchase Orders
- Add New Purchase Order

### Person 3 — Amin
- Base list/workspace shell
- Project/Contract Management List
- Project Add/Edit Form
- Import/Export Shipment Tracking List
- Shipment Add/Edit Form

## Run

```bash
npm install
npm run dev
```

Open: http://localhost:5173

## Build

```bash
npm run build
```

## Notes
- This is frontend only; mock data is stored in `src/data/mockData.js`.
- Forms currently demonstrate frontend behavior and can later be connected to Node.js/Express APIs.
- Shared components/layouts are separated so team members can work independently without duplicating UI code.
