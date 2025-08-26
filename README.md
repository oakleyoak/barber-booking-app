# Calendar-Based Booking Management App

A precision scheduling and earnings tracking web application built with FastAPI and React.

## Features

- Interactive calendar view with month/week/day toggle
- Drag-and-drop rescheduling
- Click-to-add booking functionality
- Earnings dashboard with daily/weekly summaries
- Excel import from existing booking data
- SQLite database for lightweight deployment

## Project Structure

```
booking-app/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── database.py     # Database configuration
│   │   ├── crud.py         # CRUD operations
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── bookings.py # Booking endpoints
│   │       └── earnings.py # Earnings endpoints
│   ├── imports/
│   │   └── excel_import.py # Excel import logic
│   ├── requirements.txt
│   └── run.py             # Development server
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── data/
    └── Bookings_sheet 5 weeks.xlsx  # Import data
```

## Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, Pandas
- **Frontend**: React, TypeScript, FullCalendar.js, Tailwind CSS
- **Development**: Vite, Uvicorn
- **Deployment**: Vercel (frontend) + Render/Railway (backend)
