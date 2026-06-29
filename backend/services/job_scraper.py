import os
import logging
from playwright.async_api import async_playwright

try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None

logger = logging.getLogger("[JobScraper]")

class JobScraper:
    """Async Headless Scraper safely parsing DOMs leveraging stealth architectures."""
    
    def __init__(self):
        self.enabled = os.getenv("ENABLE_SCRAPER", "false").lower() == "true"

    async def scrape_jobs(self, role: str) -> list:
        if not self.enabled:
            logger.info("Playwright Scraper bypassed gracefully via ENABLE_SCRAPER toggle.")
            return []

        logger.info(f"Initiating async headless Playwright scrape natively for: {role}")
        scraped_jobs = []
        try:
            async with async_playwright() as p:
                exec_path = p.chromium.executable_path
                if not exec_path or not os.path.exists(exec_path):
                    logger.warning(f"[JobScraper] Playwright Chromium executable not found at: '{exec_path}'. Skipping scraping gracefully.")
                    return []

                try:
                    # Disable automation flags natively
                    browser = await p.chromium.launch(
                        headless=True, 
                        args=["--disable-blink-features=AutomationControlled"]
                    )
                except Exception as launch_err:
                    logger.warning(f"[JobScraper] Playwright browser launch failed (likely executable missing): {launch_err}. Skipping scraping gracefully.")
                    return []
                
                # Apply stealth User-Agents explicitly mimicking real browsers natively
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
                    extra_http_headers={
                        "Accept-Language": "en-US,en;q=0.9"
                    }
                )
                
                page = await context.new_page()
                
                # Force Stealth overrides explicitly stripping webdriver keys natively!
                if stealth_async:
                    await stealth_async(page)
                
                search_url = f"https://www.naukri.com/{role.replace(' ', '-')}-jobs"
                
                # Replace time.sleep() with smart networkidle waits explicitly enforcing 15s absolute bounds natively
                logger.info(f"Navigating to {search_url} evaluating networkidle states...")
                try:
                    await page.goto(search_url, timeout=15000, wait_until="networkidle")
                except Exception as e:
                    logger.warning(f"Timeout reaching Naukri DOM: {e}. Gracefully handling timeout bounds.")
                
                # Safely parse nested selectors resolving cleanly natively
                try:
                    await page.wait_for_selector(".srp-jobtuple-wrapper, article.jobTuple", timeout=10000)
                except Exception:
                    logger.warning(f"Naukri CSS blocks shifted abruptly for '{role}'. Ending safely bypassing failures.")
                    await browser.close()
                    return []
                
                job_cards_wrapper = await page.locator(".srp-jobtuple-wrapper").all()
                job_cards_tuple = await page.locator("article.jobTuple").all()
                job_cards = job_cards_wrapper if job_cards_wrapper else job_cards_tuple
                
                count = 0
                for card in job_cards:
                    if count >= 10:
                        break
                    
                    try:
                        title_loc = card.locator("a.title").first
                        title = (await title_loc.inner_text()).strip()
                        
                        try:
                            company_loc = card.locator("a.comp-name").first
                            company = (await company_loc.inner_text()).strip()
                        except:
                            try:
                                company_loc = card.locator("a.subTitle").first
                                company = (await company_loc.inner_text()).strip()
                            except:
                                company = "Confidential"
                        
                        try:
                            loc_selector = card.locator("span.locWdth, li.location span").first
                            location = (await loc_selector.inner_text()).strip()
                        except:
                            location = "India"
                            
                        link = await title_loc.get_attribute("href")
                        
                        scraped_jobs.append({
                            "title": title,
                            "company": company,
                            "location": location,
                            "link": link or "#",
                            "role": role
                        })
                        count += 1
                    except Exception as e:
                        logger.warning(f"Error parsing structural job tuples safely isolating exceptions natively: {e}")
                
                await browser.close()
                logger.info(f"Playwright async successfully injected {len(scraped_jobs)} mapped jobs natively!")
                
        except Exception as e:
            logger.error(f"Global Playwright async orchestration crashed resolving securely natively: {e}")
            scraped_jobs = []
            
        return scraped_jobs
