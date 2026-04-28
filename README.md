# Simple Outpass Management System

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Folder Structure
- `public/` -> frontend files
- `models/` -> mongoose models
- `routes/` -> express routes
- `server.js` -> main server file

## Setup
1. Start MongoDB locally (default port `27017`).
2. In terminal:
   ```bash
   cd outpass-system
   npm install
   npm start
   ```
3. Open `http://localhost:3000`

## Demo Login Users
- Student: `Aman`
- Student: `Riya`
- Admin: `Warden`

Select proper role on login page.

## APIs Implemented
- `POST /login`
- `POST /outpass/create`
- `GET /outpass/my`
- `GET /outpass/all`
- `POST /outpass/update-status`

## Logic Added
- Status flow: `Pending`, `Approved`, `Rejected`
- Return time validation (must be after out time)
- Overlap prevention for same student (`Pending/Approved` overlap blocked)
