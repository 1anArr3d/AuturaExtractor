import sqlite3
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import scraper
import inspectionscrape

DB_PATH = 'autura_inventory.db'

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    scraper.init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def query_db(query, args=(), one=False):
    """Helper to handle boilerplate SQLite logic."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(query, args)
        rv = cur.fetchall()
        return (rv[0] if rv else None) if one else rv

# api routes

@app.get("/vehicles")
def get_vehicles():
    rows = query_db("SELECT * FROM vehicles")
    return [dict(row) for row in rows]

@app.get("/odometer/{vin}")
def get_odometer_history(vin: str):
    rows = query_db("SELECT * FROM odometer_history WHERE vin = ? ORDER BY inspection_date DESC", (vin,))
    return [dict(row) for row in rows]

@app.post("/scrape/{auction_id}")
async def start_scrape(auction_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(scraper.scrape_data, auction_id)
    return {"status": "started", "auction_id": auction_id}

@app.post("/inspectionscrape/{vin}")
async def start_inspection(vin: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(inspectionscrape.run_inspection_scrape, vin)
    return {"status": "started", "vin": vin}

@app.delete("/vehicles")
def clear_database():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM vehicles")
        conn.execute("DELETE FROM odometer_history")
    return {"status": "success", "message": "All data cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)