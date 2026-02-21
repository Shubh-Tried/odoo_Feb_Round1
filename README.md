# FleetFlow 🚛

A modular fleet & logistics management SPA built with **FastAPI** and vanilla **JavaScript**.

## Features

- **Role-Based Access** — Manager, Dispatcher, Safety Officer, Financial Analyst
- **Command Center** — Live KPIs, fleet utilization & revenue charts
- **Vehicle Registry** — Manage fleet inventory with status toggles
- **Trip Dispatcher** — Create dispatches, track active trips
- **Maintenance Logs** — Log service entries and preventive maintenance
- **Expense & Fuel** — Track operational costs and fuel entries
- **Driver Performance** — Safety scores, shift compliance, CDL tracking
- **Analytics & Reports** — Fuel efficiency trends, ROI by vehicle class
- **User Management** — Manager-only role assignment and user CRUD
- **Dark Mode** — Toggle with localStorage persistence
- **Notification & Settings** — Dropdown panels with alerts

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn |
| Frontend | HTML5, Vanilla JS, CSS3 |
| Templating | Jinja2 |
| Charts | Chart.js |
| Icons | Font Awesome 6 |

## Quick Start

```bash
# Install dependencies
pip install fastapi uvicorn jinja2

# Run the server
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000** in your browser.

## Project Structure

```
odoo/
├── main.py                 # FastAPI app + API endpoints
├── templates/
│   └── index.html          # Complete SPA template
├── static/
│   ├── styles.css          # All CSS styles
│   └── js/
│       └── app.js          # SPA logic, charts, user management
├── requirements.txt
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serve the SPA |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create a user |
| `PUT` | `/api/users/{id}/role` | Update user role |
| `DELETE` | `/api/users/{id}` | Delete a user |
