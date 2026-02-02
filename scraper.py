from playwright.sync_api import sync_playwright

def scrape_name(auctionid):
    with sync_playwright() as p:
        url = f"https://app.marketplace.autura.com/auction/SA-TX/auction-{auctionid}"
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        
        page.wait_for_selector(".ant-card-meta-title")
        titles = page.query_selector_all(".ant-card-meta-title")

        for title in titles:
            print(title.text_content().strip())

        browser.close()

scrape_name(108922)
