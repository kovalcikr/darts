from playwright.sync_api import sync_playwright, Page, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the tournament stats page
        page.goto("http://localhost:3000/stats/tournaments/1", timeout=30000)

        # Wait for a key element to be visible to ensure the page has loaded
        expect(page.get_by_text("Relax darts cup:")).to_be_visible(timeout=20000)

        # Take a screenshot of the desktop view
        page.screenshot(path="jules-scratch/verification/desktop_verification.png")

        # Change viewport to a mobile size (iPhone 11 Pro)
        page.set_viewport_size({"width": 375, "height": 812})

        # Wait for a moment for any responsive adjustments
        page.wait_for_timeout(500)

        # Take a screenshot of the mobile view
        page.screenshot(path="jules-scratch/verification/mobile_verification.png")

        browser.close()

if __name__ == "__main__":
    run()