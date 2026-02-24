AUTURA INVENTORY & MyTxCar INSPECTION Extractor

<img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGQ3Z2ozMHZ5c2J3eXV0aHh3emQxMDk5dTJ3MjhlYWZlODlsam91YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fPXcc6m3PfpCUWuECx/giphy.gif" height= "500" width="500>

<img src="https://github.com/1anArr3d/AuturaExtractor/blob/main/auturascreenie.png?raw=true" height= "500" width="500">

A full-stack automation tool designed to aggregate vehicle 
auction data and cross-reference it with historical DMV 
inspection records for mileage verification.

--- TECH STACK ---
- Backend: Python (FastAPI)
- Automation: Playwright (Chromium)
- Database: SQLite3
- Frontend: React (Vite)
- Styling: Custom CSS3 / Tailwind

--- KEY FEATURES ---
- Asynchronous Scraping: Uses FastAPI BackgroundTasks to 
  run scrapers without freezing the UI.
- Anti-Bot Bypass: Handles Cloudflare Turnstile and 
  ASP.NET session state persistence.
- Smart Data Logic: Deduplicates inspection records by 
  unique year and formats mileage for clear UI display.
- Relational Storage: Tracks multiple inspection points per 
  VIN in a historical odometer table.

--- INSTALLATION & SETUP ---

1. BACKEND SETUP:
   Open your terminal in the root directory:
   > pip install -r requirements.txt
   > python main.py

   *The API runs at http://127.0.0.1:8000 and auto-inits 
    the database on first launch.*

2. FRONTEND SETUP:
   Open a second terminal:
   > cd autura-frontend
   > npm install
   > npm run dev

   *The dashboard will typically run at http://localhost:5173*

--- PROJECT STRUCTURE ---
- main.py: FastAPI routes and database management.
- scraper.py: Marketplace scraping logic.
- inspectionscrape.py: DMV/MyTxCar historical data engine.
- autura_inventory.db: Local SQLite relational storage.
- autura-frontend/: React source code and dashboard UI.
