# Mobile Native App Plan

## 📱 React Native Mobile App (Offline-First)

### Current Status: Web App ✅
- Backend: FastAPI + SQLite
- Frontend: React web app
- Limitation: Requires network connection

### Proposed: Native Mobile App 📱

#### **Option 1: React Native (Recommended)**
- **Offline-first** with local SQLite database
- **Cross-platform** (iOS & Android)
- **Reuse existing** React components and logic
- **Future Google Calendar sync** ready

#### **Option 2: Progressive Web App (PWA)**
- **Install as native app** on phone
- **Offline capabilities** with service workers
- **Faster implementation** (modify existing web app)
- **Works on any phone** (iOS/Android)

## 🚀 Implementation Plan

### Phase 1: Native React Native App

#### **Core Features (Offline)**
- Local SQLite database on phone
- Full calendar interface (month/week/day views)
- Create, edit, delete bookings
- Earnings tracking and summaries
- Excel/CSV import from phone storage
- No internet required for core functionality

#### **Tech Stack**
- **React Native** + TypeScript
- **React Native SQLite** for local database
- **React Native Calendars** for calendar interface
- **AsyncStorage** for settings/preferences
- **React Native FS** for file operations

#### **File Structure**
```
booking-mobile/
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   ├── BookingForm/
│   │   └── Dashboard/
│   ├── database/
│   │   ├── sqlite.ts
│   │   └── models/
│   ├── screens/
│   │   ├── CalendarScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   └── EarningsScreen.tsx
│   ├── services/
│   │   ├── bookingService.ts
│   │   └── syncService.ts
│   └── utils/
├── android/
├── ios/
└── package.json
```

### Phase 2: Google Calendar Integration

#### **Sync Features**
- **Two-way sync** with Google Calendar
- **Offline-first** approach (sync when connected)
- **Conflict resolution** for overlapping events
- **Background sync** when app opens

#### **Sync Logic**
1. **Export to Google**: Push local bookings to Google Calendar
2. **Import from Google**: Pull Google events as bookings
3. **Merge conflicts**: User decides which version to keep
4. **Incremental sync**: Only sync changes since last sync

## 🛠️ Quick Implementation Options

### Option A: Convert to PWA (Fastest - 1-2 hours)
- Modify existing web app
- Add service worker for offline
- Add manifest for "install as app"
- Works immediately on your phone

### Option B: React Native App (Complete - 1-2 days)
- Build proper native app
- Full offline capabilities
- Better performance and UX
- Professional mobile app experience

## 📋 Immediate Action Plan

Would you prefer:

1. **Quick PWA conversion** (modify existing app to work offline + installable)
2. **Full React Native app** (complete mobile rewrite)
3. **Both** (PWA now, React Native later)

The PWA approach would get you a working offline mobile app in a couple hours, while the React Native version would be a complete professional mobile app but take longer.

## 🔄 Google Calendar Sync Architecture (Future)

```typescript
// Sync service structure
class CalendarSyncService {
  async exportToGoogle(bookings: Booking[]) {
    // Push local bookings to Google Calendar
  }
  
  async importFromGoogle(): Promise<Booking[]> {
    // Pull Google Calendar events
  }
  
  async resolveConflicts(local: Booking[], remote: Booking[]) {
    // Handle conflicting appointments
  }
  
  async backgroundSync() {
    // Sync when app becomes active
  }
}
```

Which approach would you like me to implement first?
