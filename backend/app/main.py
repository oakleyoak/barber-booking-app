from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.routers import bookings, earnings

# Create database tables
create_tables()

app = FastAPI(
    title="Booking Management API",
    description="A precision scheduling and earnings tracking API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bookings.router)
app.include_router(earnings.router)

@app.get("/")
def read_root():
    return {"message": "Booking Management API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
