# 🆕 Recent Features & Improvements (2025)

- **15-Minute Appointment Slots**: All booking components now use 15-minute intervals for appointments, allowing for more precise scheduling.
- **Dynamic Owner Earnings Calculation**: The owner's share from staff is now dynamically calculated based on each staff member's commission rate (Owner Share = 100% - Staff Commission Rate). No more hardcoded percentages.
- **Per-Employee Earnings Breakdown**: Owners can view a detailed breakdown of earnings per employee, including the owner's share and a review option for each staff member.
- **Admin Panel Restricted to Owner**: Only users with the 'Owner' role can access the admin panel. Managers and other roles are denied access.
- **Live Commission Rate Updates**: Changes to staff commission rates in the admin panel are immediately reflected in all earnings calculations and owner shares.
- **Accessibility Improvements**: All form elements and buttons in the admin panel now include proper labels, placeholders, and titles for improved accessibility.
- **Real-Time Supabase Sync for Earnings**: All earnings, owner and staff breakdowns, and summaries now pull directly from the Supabase `bookings` table for 100% live data accuracy. No more stale or missing figures.
- **Bugfixes**: Fixed issues where detailed earnings and staff breakdowns showed zero due to out-of-sync transaction logic. All breakdowns now match the live bookings data.

# Edge & Co Barbershop Management System

A comprehensive business management system for Edge & Co Barbershop with booking management, earnings tracking, inventory management, multi-language support, and advanced communication features.

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

### 🌐 Multi-Language Support
- **6 Languages** - English, Turkish, Arabic, Persian, Greek, Russian
- **WhatsApp Integration** - Localized booking confirmations and invoice sharing
- **Email Notifications** - Multi-language email confirmations and reminders
- **Dynamic Translation** - Real-time language switching without page reload

### 📱 Communication & Integration
- **WhatsApp Bookings** - Send booking confirmations via WhatsApp in customer's language
- **WhatsApp Invoices** - Share invoices directly through WhatsApp
- **Email Notifications** - Automated email confirmations with review links
- **Google Maps Integration** - Direct links to leave reviews: `https://maps.app.goo.gl/SXLM36Vh5qfqMV6W8`
- **Stripe Payments** - Secure online payment processing

### 📱 Mobile Features
- **Progressive Web App (PWA)** - Works on mobile devices with offline capabilities
- **Android APK** - Native Android app via Capacitor
- **Responsive Design** - Optimized for all screen sizes
- **Touch-Optimized UI** - Native mobile experience

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Mobile**: Capacitor v6 for Android APK generation
- **Deployment**: Netlify (auto-deploy from GitHub)
- **Internationalization**: Custom i18n system with 6 languages
- **Communication**: WhatsApp API integration, Email notifications
- **Payments**: Stripe integration for online payments

## 🔐 User Roles & Permissions

- **Owner**: Full access to all features including admin panel and user management
- **Manager**: Same access as Owner for day-to-day operations
- **Barber**: Access to bookings, customers, earnings, and operational features
- **Apprentice**: Limited access to basic booking and customer features

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Git (for cloning)

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
# Build the web app
npm run build

# Sync web assets to Android project
npx cap sync android

# Open Android Studio for APK generation
npx cap open android
```

## 🌐 Multi-Language Support

The application supports 6 languages with full localization:

- **English** (en)
- **Turkish** (tr) - Default language
- **Arabic** (ar)
- **Persian** (fa)
- **Greek** (el)
- **Russian** (ru)

### Language Features
- **Real-time switching** - Change language without page reload
- **WhatsApp integration** - Booking confirmations sent in customer's language
- **Email notifications** - Localized email templates
- **RTL support** - Proper right-to-left layout for Arabic and Persian

## 🌐 Deployment

This application is configured for automatic deployment on Netlify:
- **Production**: Deployed automatically from the `main` branch
- **Database**: Supabase backend handles all data operations
- **CDN**: Netlify provides global CDN for fast loading
- **Domain**: Connected to custom domain via Netlify

### Environment Configuration

Update the Supabase configuration in `mobile-pwa/src/lib/supabase.ts` with your project details.

## 📱 Communication Features

### WhatsApp Integration
- **Booking Confirmations** - Send localized booking confirmations via WhatsApp
- **Invoice Sharing** - Share invoices directly through WhatsApp
- **Multi-language Support** - Messages sent in customer's preferred language

### Email Notifications
- **Booking Confirmations** - Automated email confirmations with booking details
- **Staff Notifications** - Email alerts for new bookings and schedule changes
- **Review Links** - Direct links to Google Maps for customer reviews

### Google Maps Integration
- **Review Link**: `https://maps.app.goo.gl/SXLM36Vh5qfqMV6W8`
- **Integrated in all communications** - WhatsApp messages, emails, and invoices
- **Multi-language review prompts** - Localized "please review us" messages

## 📋 Business Configuration

The system is configured for Edge & Co Barbershop with:
- Custom branding and logo
- Turkish Lira (₺) currency
- Barbershop-specific services and pricing
- Turkish business hours and operations
- Multi-language support for international clientele
- WhatsApp integration for customer communication
- Google Maps integration for reviews and directions

## 🔧 Advanced Features

- **Custom Pricing**: All services, products, and expenses support custom amounts
- **Invoice Generation**: Automated invoice creation with WhatsApp sharing
- **Stripe Integration**: Secure payment processing for online transactions
- **Email Notifications**: Automated multi-language email confirmations and reminders
- **Data Analytics**: Comprehensive reporting and analytics dashboard
- **Real-time Updates**: Live booking updates and synchronization
- **Offline Capability**: PWA works offline with data synchronization
- **Role-based Security**: Granular permissions for different user types

## 📱 Mobile App

The system includes a native Android app generated with Capacitor:
- Full offline capability with data synchronization
- Native mobile UI/UX optimized for touch
- WhatsApp integration for booking confirmations
- Multi-language support (6 languages)
- Google Maps integration for reviews
- Push notification support (configurable)
- Camera integration for photos and documentation
- Native Android APK for Play Store distribution

## 🤝 Support

For support and feature requests, contact the development team or submit an issue on GitHub.

## 📄 License

Private project - All rights reserved to Edge & Co Barbershop.
