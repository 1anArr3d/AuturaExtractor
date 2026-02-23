import sqlite3
from playwright.sync_api import sync_playwright

BASE_URL = "https://app.marketplace.autura.com"

def init_db():
    with sqlite3.connect('autura_inventory.db') as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS vehicles (
            vin TEXT PRIMARY KEY, year TEXT, make TEXT, model TEXT, color TEXT,
            key_status TEXT, catalytic_converter TEXT, start_status TEXT, 
            engine_type TEXT, transmission TEXT, auction_id TEXT, city TEXT,
            last_recorded_odo TEXT)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS odometer_history (
            row_id TEXT PRIMARY KEY, vin TEXT, inspection_date TEXT, mileage INTEGER)''')

def save_vehicle(conn, vehicle, auction_id, city):
    data = (
        vehicle.get("VIN"), vehicle.get("Year"), vehicle.get("Make"),
        vehicle.get("Model"), vehicle.get("Color"), vehicle.get("Key status"),
        vehicle.get("Catalytic Converter"), vehicle.get("Start status"),
        vehicle.get("Engine type"), vehicle.get("Transmission"),
        str(auction_id), city
    )
    conn.execute('''
        INSERT INTO vehicles (vin, year, make, model, color, key_status, 
        catalytic_converter, start_status, engine_type, transmission, auction_id, city)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(vin) DO UPDATE SET auction_id=excluded.auction_id
    ''', data)

def scrape_data(auctionid, city="SA-TX"):
    init_db()
    with sqlite3.connect('autura_inventory.db') as conn:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            try:
                page.goto(f"{BASE_URL}/auction/{city}/auction-{auctionid}", wait_until="load")
                page.wait_for_selector('a[href*="/vehicle/"]', timeout=10000)
                links = [l.get_attribute("href") for l in page.query_selector_all('a[href*="/vehicle/"]')]
                
                for href in set(links):
                    page.goto(f"{BASE_URL}{href}", wait_until="load")
                    table = page.wait_for_selector("div.ant-table-content")
                    rows = table.query_selector_all("tr")
                    vehicle_data = {r.query_selector_all("td")[0].inner_text().strip(): 
                                    r.query_selector_all("td")[1].inner_text().strip() 
                                    for r in rows if len(r.query_selector_all("td")) >= 2}
                    
                    if "VIN" in vehicle_data:
                        save_vehicle(conn, vehicle_data, auctionid, city)
                        conn.commit()
            except:
                pass
            finally:
                browser.close()