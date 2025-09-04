# Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Current Architecture

This is a **React TypeScript PWA** with:
- **Frontend**: React 18 + TypeScript + Vite in `mobile-pwa/` directory
- **Backend**: Supabase (PostgreSQL database + authentication)
- **Mobile**: Capacitor v6 for Android APK generation
- **Deployment**: Netlify (auto-deploy from GitHub)

### Windows Setup (PowerShell)

```powershell
# 1. Clone the repository
git clone https://github.com/oakleyoak/barber-booking-app.git
cd "barber-booking-app"

# 2. Navigate to the app directory
cd mobile-pwa

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

### Manual Development Setup

#### Frontend Development
```powershell
# Navigate to the app directory
cd mobile-pwa

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Android Development (APK Generation)
```powershell
cd mobile-pwa

# Build and sync to Android platform
npm run android:sync

# Open Android Studio for APK generation
npm run android

# Build APK directly (requires Android Studio/SDK)
npm run android:build
```

## 🏗️ Project Structure

```
booking app/
├── mobile-pwa/                 # Main React TypeScript app
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── BookingCalendar.tsx
│   │   │   ├── BookingManagement.tsx
│   │   │   ├── CustomerManager.tsx
│   │   │   ├── ExpenseManager.tsx
│   │   │   ├── RealEarningsTracker.tsx
│   │   │   └── ...
│   │   ├── services/           # Business logic & API calls
│   │   ├── lib/               # Supabase configuration
│   │   └── utils/             # Utility functions
│   ├── android/               # Capacitor Android project
│   └── package.json
├── netlify/                   # Netlify Functions
│   └── functions/
├── database/                  # SQL schema files
└── README.md
```

## 🔧 Development Workflow

### 1. Feature Development
```powershell
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes in mobile-pwa/src/
# Test locally with npm run dev

# Commit changes
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

### 2. Database Changes
- Database schema is managed in Supabase dashboard
- SQL files in `database/` folder for reference
- Use Supabase migration tools for schema changes

### 3. Deployment
```powershell
# Deploy to production (automatic via Netlify)
git push origin main

# Generate new Android APK after changes
cd mobile-pwa
npm run android:build
```

## 🗄️ Database Schema

### Core Tables
- `users` - Staff accounts and roles
- `customers` - Customer information
- `bookings` - Appointment bookings
- `expenses` - Business expenses
- `supplies_inventory` - Inventory management
- `equipment_maintenance` - Equipment tracking

### Authentication
- Supabase Auth handles user authentication
- Role-based access: Owner, Manager, Barber, Apprentice

## 🔌 API Integration

### Supabase Services
- Real-time database updates
- Authentication & authorization
- File storage for images
- Edge functions for serverless logic

### External Services
- **Stripe**: Payment processing
- **EmailJS/Netlify**: Email notifications
- **Netlify Functions**: Serverless backend functions

## 🧪 Testing & Quality

### Local Testing
```powershell
# Run development server
npm run dev

# Test all features locally
# Check responsive design on different screen sizes
# Test role-based access controls
```

### Production Testing
- Test on Netlify preview deployments
- Verify mobile responsiveness
- Test Android APK installation and functionality

## 📱 Mobile Development

### Capacitor Configuration
```powershell
# Sync changes to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Run on connected device
npx cap run android
```

### APK Generation
1. Build the web app: `npm run build`
2. Sync to Android: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Generate signed APK in Android Studio

## 🔧 Common Development Tasks

### Adding New Components
1. Create component in `src/components/`
2. Add TypeScript interfaces
3. Implement responsive design with Tailwind CSS
4. Add to main App.tsx routing

### Database Operations
1. Use existing services in `src/services/`
2. Follow established patterns for CRUD operations
3. Handle errors and loading states
4. Implement real-time updates where needed

### Styling Guidelines
- Use Tailwind CSS classes
- Follow responsive design patterns
- Maintain consistent color scheme
- Use Lucide React icons

## 🐛 Troubleshooting

### Common Issues
1. **Node modules issues**: Delete `node_modules` and run `npm install`
2. **Build failures**: Check TypeScript errors with `npm run build`
3. **Android build issues**: Ensure Java 17 and Android SDK are installed
4. **Supabase connection**: Verify API keys in `src/lib/supabase.ts`

### Getting Help
- Check console for error messages
- Verify Supabase dashboard for database issues
- Review Netlify deployment logs
- Check Android Studio build logs for APK issues

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
