# LNMIIT Postal Records System

A simple web-based system to manage incoming and outgoing postal records (letters, parcels, official documents) for LNMIIT.

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Main Features
- Staff login (Admin / Clerk)
- Add postal records with validation
- Auto-generated Reference Number (`LN-POST-...`)
- Search and filter records
- Update record status (`Received`, `Dispatched`, `In Transit`, `Delivered`)
- Dashboard KPIs:
  - Incoming Today
  - Outgoing Today
  - Pending
  - Delivered
  - Overdue
  - Total Records
- Department workload and priority queue
- Dark/Light mode
- Demo data loader

## Folder Structure
- `public/` frontend pages, styles, scripts
- `models/` mongoose schemas
- `routes/` API routes
- `server.js` app entry point

## Run Locally
1. Ensure MongoDB is running, or set Atlas `MONGO_URI`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   npm start
   ```
4. Open:
   [http://localhost:3000](http://localhost:3000)

## Environment Variable
- `MONGO_URI` (optional)
  - default: `mongodb://127.0.0.1:27017/postal_records_db`

## Demo Login
- `admin.post@lnmiit.ac.in` / `admin123`
- `clerk.post@lnmiit.ac.in` / `clerk123`

## Core APIs
- `POST /login`
- `POST /records/create`
- `POST /records/load-demo`
- `GET /records/all`
- `GET /records/search`
- `GET /records/analytics`
- `POST /records/update`
