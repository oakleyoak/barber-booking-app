# Deployment Configuration

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./bookings.db
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Production Deployment

### Backend (Render/Railway)

1. **Render deployment:**
   - Connect your GitHub repository
   - Build command: `pip install -r requirements.txt`
   - Start command: `python run.py`
   - Environment variables: Set DATABASE_URL for PostgreSQL if needed

2. **Railway deployment:**
   ```bash
   railway login
   railway init
   railway add
   railway deploy
   ```

### Frontend (Vercel)

1. **Vercel deployment:**
   ```bash
   npm install -g vercel
   cd frontend
   vercel
   ```

2. **Build settings:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

### Environment Configuration

#### Production Backend Environment:
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
