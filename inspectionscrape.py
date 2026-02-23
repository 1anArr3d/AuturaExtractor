import sqlite3
from playwright.sync_api import sync_playwright

DB_PATH = 'autura_inventory.db'

def save_history(vin, results):
    if not results: return
    with sqlite3.connect(DB_PATH) as conn:
        for i, res in enumerate(results):
            conn.execute('INSERT OR REPLACE INTO odometer_history VALUES (?, ?, ?, ?)', 
                         (f"{vin}_{i}", vin, res['date'], res['odometer']))
        
        display = "\n".join([f"{r['date']}: {r['odometer']:,}" for r in results])
        conn.execute("UPDATE vehicles SET last_recorded_odo = ? WHERE vin = ?", (display, vin))

def run_inspection_scrape(vin):
    results, seen_years = [], set()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled"])
        page = browser.new_page()
        try:
            page.goto("https://www.mytxcar.org/TXCar_Net/VehicleTestDetail.aspx", timeout=60000)
            page.wait_for_function("document.querySelector('[name=\"cf-turnstile-response\"]').value.length > 0")
            page.locator('input[type="submit"]').click()

            page.locator("#txtVin").fill(vin)
            page.locator('input[title="Search"]').click()

            sel = "a[onclick*='DoSelect']"
            page.wait_for_selector(sel, timeout=10000)
            
            for i in range(page.locator(sel).count()):
                if len(results) >= 3: break
                
                row = page.locator("table tbody tr").filter(has=page.locator(sel)).nth(i)
                date = row.locator("td").nth(1).inner_text().split()[0]
                year = date.split('/')[-1]

                if year in seen_years: continue
                seen_years.add(year)

                page.locator(sel).nth(i).click()
                page.wait_for_selector("td:has-text('Odometer')")
                miles = int(page.locator("td:has-text('Odometer') + td").inner_text().replace(',', '').strip())
                results.append({"date": date, "odometer": miles})
                
                page.click("#btnBack")
                page.wait_for_selector(sel)

            save_history(vin, results)
        except Exception as e: print(f"Error: {e}")
        finally:
            try: browser.close()
            except: pass