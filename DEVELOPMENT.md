# Development Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm or yarn

### Windows Setup (PowerShell)

```powershell
# 1. Clone/download the project
cd "D:\PROJECT\booking app"

# 2. Run the setup script
.\setup.bat

# 3. Start the application
.\start.bat
```

### Manual Setup

#### Backend Setup
```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py
```

#### Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌟 Features Implemented

### ✅ Backend (FastAPI)
- **Complete REST API** for bookings management
- **SQLite database** with SQLAlchemy ORM
- **CRUD operations** for bookings
- **Earnings calculations** (daily/weekly summaries)
- **Conflict detection** for overlapping bookings
- **Excel import functionality** with flexible column mapping
- **CORS support** for frontend integration
- **Auto-generated API documentation** at `/docs`

### ✅ Frontend (React + TypeScript)
- **Interactive calendar** with FullCalendar.js
- **Month/Week/Day views** with easy switching
- **Drag-and-drop rescheduling** of bookings
- **Click-to-add** new bookings
- **Modal forms** for creating/editing bookings
- **Real-time earnings dashboard** with daily/weekly totals
- **Responsive design** with Tailwind CSS
- **Type-safe** with TypeScript

### ✅ Data Management
- **Excel import script** with smart column detection
- **Flexible data mapping** for various Excel formats
- **Database migrations** and setup automation
- **Conflict detection** and validation

## 📁 Project Structure

```
booking-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── crud.py          # Database operations
│   │   ├── database.py      # Database config
│   │   └── routers/
│   │       ├── bookings.py  # Booking endpoints
│   │       └── earnings.py  # Earnings endpoints
│   ├── imports/
│   │   └── excel_import.py  # Excel import logic
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingCalendar.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   └── EarningsDashboard.tsx
│   │   ├── hooks/
│   │   │   └── useBookings.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── data/
    └── README.md            # Excel import instructions
```

## 🔧 API Endpoints

### Bookings
- `GET /bookings/` - List all bookings with optional filters
- `GET /bookings/{id}` - Get specific booking
- `POST /bookings/` - Create new booking
- `PUT /bookings/{id}` - Update booking
- `DELETE /bookings/{id}` - Delete booking
- `GET /bookings/date/{date}` - Get bookings for specific date

### Earnings
- `GET /earnings/daily/{date}` - Daily earnings summary
- `GET /earnings/weekly/{week_start}` - Weekly earnings summary
- `GET /earnings/weekly/current` - Current week earnings
- `GET /earnings/range/{start_date}/{end_date}` - Date range earnings

## 📊 Excel Import

### Supported Column Names
The import script automatically detects columns with any of these names:

- **Client**: client, client_name, name, customer
- **Date**: date, booking_date, appointment_date
- **Start Time**: start_time, start, time, appointment_time
- **End Time**: end_time, end, duration, finish_time
- **Price**: price, cost, fee, amount, charge
- **Notes**: notes, description, comments, details
- **Location**: location, venue, address, place
- **Status**: status, state, booking_status

### Running Import
```powershell
cd backend
python imports/excel_import.py
```

## 🚀 Deployment

### Local Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Production Deployment
See `DEPLOYMENT.md` for detailed production deployment instructions.

## 🎯 Key Features for Your Workflow

### Forensic Logic & Precision
- **Conflict detection** prevents double-bookings
- **Precise datetime handling** with timezone support
- **Data validation** at API and database levels
- **Audit trail** with created/updated timestamps

### Minimal Resource Waste
- **SQLite** for lightweight local development
- **Efficient API design** with pagination
- **Optimized frontend** with React hooks
- **Smart Excel import** with error handling

### Real-World Efficiency
- **Drag-and-drop** rescheduling
- **Quick booking creation** with smart defaults
- **Earnings tracking** with daily/weekly summaries
- **Responsive design** for mobile/desktop use

## 🔄 Development Workflow

1. **Backend changes**: Server auto-reloads with uvicorn
2. **Frontend changes**: Hot-reload with Vite
3. **Database changes**: Modify models and restart server
4. **API testing**: Use `/docs` endpoint for interactive testing

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**: Check backend is running on port 8000
2. **Database issues**: Delete `bookings.db` and restart
3. **Import errors**: Check Excel column names match expected format
4. **Port conflicts**: Change ports in `run.py` (backend) or `vite.config.ts` (frontend)

### Logs
- **Backend logs**: Terminal where `python run.py` is running
- **Frontend logs**: Browser developer console
- **Database**: SQLite browser or query the `bookings.db` file

This application is designed for high-precision scheduling with forensic-level attention to detail while maintaining lightweight, efficient operation suitable for survival-grade workflows.
