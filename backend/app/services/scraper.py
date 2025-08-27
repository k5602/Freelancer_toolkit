from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

def scrape_website(url: str) -> str:
    """
    Scrape a website and return the text content.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()
