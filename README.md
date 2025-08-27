# Barber POS System

A comprehensive point-of-sale system for barbershops with booking management, earnings tracking, and administrative features.

## Features

- 📅 **Booking Calendar** - Manage appointments and time slots
- 💰 **Earnings Tracker** - Track daily, weekly, and monthly earnings
- 👥 **Customer Management** - Maintain customer database
- 👔 **Admin Panel** - Payroll and staff management (Owner only)
- 📊 **Accounting Reports** - Financial reports and profit/loss statements
- 🔐 **Authentication** - Role-based access (Owner, Barber, Apprentice)

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database & Auth)
- Lucide React (Icons)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd booking-app
```

2. Navigate to the mobile-pwa directory:
```bash
cd mobile-pwa
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

## Deployment

This application is configured for deployment on Netlify. The build output is in the `dist` directory.

## Environment Setup

Update the Supabase configuration in `src/lib/supabase.ts` with your project details.

## License

Private project - All rights reserved.
