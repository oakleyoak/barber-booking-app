# Deployment Configuration

## 🚀 Current Deployment Architecture

### Production Stack
- **Frontend**: Netlify (auto-deploy from GitHub)
- **Database**: Supabase (PostgreSQL + Auth)
- **Functions**: Netlify Functions for serverless backend
- **Mobile**: Android APK via Capacitor
- **Domain**: Connected to custom domain via Netlify

## 🌐 Netlify Deployment

### Automatic Deployment
- **Repository**: https://github.com/oakleyoak/barber-booking-app
- **Build Command**: `npm run build` (runs from root, builds mobile-pwa)
- **Publish Directory**: `mobile-pwa/dist`
- **Node Version**: 18.x (set in netlify.toml)

### Build Configuration (netlify.toml)
```toml
[build]
  base = "mobile-pwa"
  command = "npm ci && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables (Netlify)
```
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Configuration (if using)
STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
```

## 🗄️ Supabase Configuration

### Database Setup
1. **Tables**: Already configured with complete schema
   - users, customers, bookings, expenses, supplies_inventory, etc.
2. **Auth**: Configured for email/password authentication
3. **Policies**: Row Level Security (RLS) policies for data access
4. **Real-time**: Enabled for live updates

### Connection Configuration
Update `mobile-pwa/src/lib/supabase.ts`:
```typescript
const supabaseUrl = 'your-supabase-url'
const supabaseAnonKey = 'your-supabase-anon-key'
```

## 📱 Mobile App Deployment (Android APK)

### Prerequisites
- Java 17 (required for Capacitor v6)
- Android Studio with Android SDK
- Capacitor CLI

### APK Generation Process
```powershell
cd mobile-pwa

# 1. Build the web app
npm run build

# 2. Sync to Android platform
npm run android:sync

# 3. Open Android Studio
npm run android

# 4. Generate signed APK in Android Studio
# Build > Generate Signed Bundle/APK > APK
```

### Signing Configuration
Create `android/app/keystore.properties`:
```
storeFile=../keystore/release-key.jks
storePassword=your-store-password
keyAlias=your-key-alias
keyPassword=your-key-password
```

## 🔧 Netlify Functions

### Email Functions
Located in `netlify/functions/`:
- `send-email.js` - General email sending
- `send-email-clean.js` - Clean email implementation
- `create-stripe-payment.js` - Stripe payment processing
- `stripe-webhook.js` - Stripe webhook handling

### Function Environment Variables
```
# Email Configuration
EMAILJS_SERVICE_ID=your-emailjs-service
EMAILJS_TEMPLATE_ID=your-emailjs-template
EMAILJS_PUBLIC_KEY=your-emailjs-public-key

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## 🚀 Deployment Workflow

### Automatic Deployment (Recommended)
```bash
# 1. Make changes locally
git add .
git commit -m "Your changes"

# 2. Push to GitHub
git push origin main

# 3. Netlify automatically builds and deploys
# Check https://app.netlify.com for deployment status
```

### Manual Deployment
```bash
# Build locally
cd mobile-pwa
npm run build

# Deploy to Netlify CLI (if configured)
netlify deploy --prod --dir=dist
```

## 🔒 Security Configuration

### Supabase Security
- Row Level Security (RLS) enabled
- API keys properly scoped (anon key for frontend)
- Database policies restrict access by user role

### Netlify Security
- Environment variables for sensitive data
- HTTPS enforced
- Custom headers configured in netlify.toml

## 📊 Monitoring & Analytics

### Deployment Monitoring
- **Netlify Dashboard**: Build status and deployment logs
- **Supabase Dashboard**: Database performance and usage
- **Error Tracking**: Console errors monitored via browser dev tools

### Performance Optimization
- **CDN**: Netlify's global CDN for fast loading
- **Caching**: Static assets cached automatically
- **Compression**: Gzip compression enabled
- **Images**: Optimized image loading

## 🔄 Database Migrations

### Schema Updates
1. Update schema in Supabase dashboard
2. Export new schema to `database/` folder for version control
3. Test changes in development environment
4. Apply to production database

### Data Backup
- Supabase provides automated backups
- Manual exports available via Supabase dashboard
- Critical data should be backed up before major changes

## 🧪 Staging Environment

### Preview Deployments
- Every pull request creates a preview deployment
- Test changes before merging to main
- Preview URLs provided in GitHub PR comments

### Testing Checklist
- [ ] All features work correctly
- [ ] Mobile responsiveness verified
- [ ] Database operations functional
- [ ] Authentication working
- [ ] Role-based access correct
- [ ] Email notifications working

## 🆘 Troubleshooting Deployment

### Common Issues
1. **Build Failures**: Check Node.js version and dependencies
2. **Database Errors**: Verify Supabase connection and API keys
3. **Function Errors**: Check Netlify function logs
4. **Mobile Issues**: Ensure Android SDK and Java 17 are installed

### Getting Help
- Netlify deploy logs: https://app.netlify.com
- Supabase logs: Supabase dashboard
- GitHub Actions: Repository Actions tab
- Android build logs: Android Studio console
```bash
# For PostgreSQL (Render/Railway)
DATABASE_URL=postgresql://user:password@host:port/database
CORS_ORIGINS=https://your-frontend-domain.vercel.app

# For production
DEBUG=False
```

#### Production Frontend Environment:
```bash
VITE_API_URL=https://your-backend-domain.onrender.com
```

## Local Development

### Backend Setup:
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python run.py
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

## Database Migration

### SQLite to PostgreSQL (Production):
```python
# Use the following script to migrate data
import sqlite3
import psycopg2
from sqlalchemy import create_engine

# Export from SQLite
sqlite_engine = create_engine('sqlite:///./bookings.db')
bookings = pd.read_sql('SELECT * FROM bookings', sqlite_engine)

# Import to PostgreSQL
postgres_engine = create_engine(os.getenv('DATABASE_URL'))
bookings.to_sql('bookings', postgres_engine, if_exists='replace', index=False)
```
