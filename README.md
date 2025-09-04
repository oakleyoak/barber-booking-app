# Edge & Co Barbershop Management System

A comprehensive business management system for Edge & Co Barbershop with booking management, earnings tracking, inventory management, and administrative features.

## 🚀 Features

### 📅 Booking & Calendar Management
- **Booking Calendar** - Interactive calendar with appointment management
- **All Bookings** - Complete booking management with filtering and search
- **Customer Management** - Comprehensive customer database with booking history
- **Custom Pricing** - Flexible pricing for all services, products, and expenses

### 💰 Financial Management
- **Real Earnings Tracker** - Track daily, weekly, and monthly earnings with detailed analytics
- **Expense Manager** - Track and categorize business expenses with custom amounts
- **Service Menu** - Manage service pricing with inline editing capabilities

### 📦 Inventory & Operations
- **Supplies Inventory** - Track stock levels, unit costs, and reorder points
- **Equipment Maintenance** - Schedule and track equipment maintenance
- **Daily Cleaning Logs** - Track daily cleaning tasks and compliance
- **Daily Safety Checks** - Ensure workplace safety with daily checklists
- **Incident Reports** - Document and track workplace incidents

### 👥 Administration & User Management
- **User Management** - Manage staff accounts and permissions
- **Admin Panel** - Administrative tools for business operations
- **Operations Manual** - Digital operations guide and procedures
- **Role-Based Access** - Owner, Manager, Barber, and Apprentice roles

### 📱 Mobile Features
- **Progressive Web App (PWA)** - Works on mobile devices
- **Android APK** - Native Android app via Capacitor
- **Responsive Design** - Optimized for all screen sizes

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Mobile**: Capacitor v6 for Android APK generation
- **Deployment**: Netlify (auto-deploy from GitHub)

## 🔐 User Roles & Permissions

- **Owner**: Full access to all features including admin panel and user management
- **Manager**: Same access as Owner for day-to-day operations
- **Barber**: Access to bookings, customers, earnings, and operational features
- **Apprentice**: Limited access to basic booking and customer features

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/oakleyoak/barber-booking-app.git
cd barber-booking-app
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

### Android APK Generation

```bash
# Build and sync to Android
npm run android:sync

# Open Android Studio for APK generation
npm run android
```

## 🌐 Deployment

This application is configured for automatic deployment on Netlify:
- **Production**: Deployed automatically from the `main` branch
- **Database**: Supabase backend handles all data operations
- **CDN**: Netlify provides global CDN for fast loading

### Environment Configuration

Update the Supabase configuration in `mobile-pwa/src/lib/supabase.ts` with your project details.

## 📋 Business Configuration

The system is configured for Edge & Co Barbershop with:
- Custom branding and logo
- Turkish Lira (₺) currency
- Barbershop-specific services and pricing
- Turkish business hours and operations

## 🔧 Custom Features

- **Custom Pricing**: All services, products, and expenses support custom amounts
- **Invoice Generation**: Automated invoice creation and email delivery
- **Stripe Integration**: Payment processing for online transactions
- **Email Notifications**: Automated email confirmations and reminders
- **Data Analytics**: Comprehensive reporting and analytics dashboard

## 📱 Mobile App

The system includes a native Android app generated with Capacitor:
- Full offline capability
- Native mobile UI/UX
- Push notifications support
- Camera integration for photos

## 🤝 Support

For support and feature requests, contact the development team or submit an issue on GitHub.

## 📄 License

Private project - All rights reserved to Edge & Co Barbershop.
