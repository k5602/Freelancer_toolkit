import asyncio
from playwright.async_api import async_playwright
from urllib.parse import urlparse
from typing import Dict, Any, List


def _normalize_text(text: str | None) -> str:
    if not text:
        return ""
    return " ".join(text.split())


async def _extract_text(page, selectors: List[str]) -> str:
    for sel in selectors:
        try:
            locator = page.locator(sel)
            if await locator.count() > 0:
                content = await locator.first().inner_text()
                content = _normalize_text(content)
                if content:
                    return content
        except Exception:
            pass
    return ""


async def _extract_all_texts(page, selector: str) -> List[str]:
    try:
        texts = await page.locator(selector).all_inner_texts()
        return [_normalize_text(t) for t in texts if _normalize_text(t)]
    except Exception:
        return []


async def parse_upwork(page) -> Dict[str, Any]:
    # Common selectors for Upwork job pages
    title = await _extract_text(page, [
        "h1[data-test='job-title']",
        "h1.up-card-header",
        "h1",
    ])
    description = await _extract_text(page, [
        "div[data-test='job-description']",
        "section[data-test='job-description']",
        "div[data-qa='job-description']",
    ])
    budget = await _extract_text(page, [
        "span[data-test='job-type'] + span",
        "span[data-test='budget']",
        "div[data-qa='job-details'] :text('Budget') + *",
    ])
    hourly = await _extract_text(page, [
        "span[data-test='job-type']",
        "div[data-test='about-client']:has-text('Hourly')",
    ])
    skills = await _extract_all_texts(page, "a[aria-label='Skill or expertise']")
    timeline = await _extract_text(page, [
        "div[data-test='duration']",
        "div:has(> strong:has-text('Duration')) span",
    ])
    client_location = await _extract_text(page, [
        "span[data-test='client-location']",
        "div:has(> strong:has-text('Location')) span",
    ])

    return {
        "platform": "upwork",
        "title": title,
        "description": description,
        "requirements": "",
        "budget": budget or hourly,
        "timeline": timeline,
        "skills": skills,
        "currency": "",
        "location": client_location,
    }


async def parse_freelancer(page) -> Dict[str, Any]:
    title = await _extract_text(page, [
        "h1.ProjectViewHeader-title",
        "h1",
    ])
    description = await _extract_text(page, [
        "div.Project-description",
        "div[data-target='project-view.description']",
        "section:has(h2:has-text('Project Description'))",
    ])
    budget = await _extract_text(page, [
        "div.ProjectViewHeader-budget",
        "span:has-text('Budget') + span",
        "span:has-text('BUDGET') + span",
    ])
    skills = await _extract_all_texts(page, "a[href*='/jobs/']")
    timeline = await _extract_text(page, [
        "span:has-text('Duration') + span",
    ])
    location = await _extract_text(page, [
        "span:has-text('Location') + span",
    ])
    return {
        "platform": "freelancer",
        "title": title,
        "description": description,
        "requirements": "",
        "budget": budget,
        "timeline": timeline,
        "skills": skills,
        "currency": "",
        "location": location,
    }


async def parse_mostaql(page) -> Dict[str, Any]:
    # Mostaql.com (Arabic language) selectors
    title = await _extract_text(page, [
        "h1.project-header__title",
        "h1",
    ])
    description = await _extract_text(page, [
        "div.project-content__text",
        "div.project-show-content",
        "section:has(h3:has-text('تفاصيل المشروع'))",
    ])
    budget = await _extract_text(page, [
        "div.project-about__info:has(span:has-text('الميزانية')) span:nth-of-type(2)",
        "span:has-text('الميزانية') + span",
    ])
    skills = await _extract_all_texts(page, "a.project-skills__item, a[href*='/tags/']")
    timeline = await _extract_text(page, [
        "div.project-about__info:has(span:has-text('مدة التنفيذ')) span:nth-of-type(2)",
    ])
    location = await _extract_text(page, [
        "div.project-about__info:has(span:has-text('بلد')) span:nth-of-type(2)",
    ])
    return {
        "platform": "mostaql",
        "title": title,
        "description": description,
        "requirements": "",
        "budget": budget,
        "timeline": timeline,
        "skills": skills,
        "currency": "",
        "location": location,
    }


async def scrape_job_posting(url: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 900},
            java_script_enabled=True,
        )
        page = await context.new_page()
        await page.goto(url, timeout=60000, wait_until="domcontentloaded")
        # Give page a moment for client-side rendering
        try:
            await page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass

        host = urlparse(url).hostname or ""
        host = host.lower()

        parsed: Dict[str, Any]
        try:
            if "upwork.com" in host:
                parsed = await parse_upwork(page)
            elif "freelancer.com" in host:
                parsed = await parse_freelancer(page)
            elif "mostaql.com" in host or "mostaqel.com" in host or "mustaqel.com" in host:
                parsed = await parse_mostaql(page)
            else:
                # Generic fallback
                parsed = {
                    "platform": "generic",
                    "title": _normalize_text(await page.title()),
                    "description": _normalize_text(await page.inner_text("body")),
                    "requirements": "",
                    "budget": "",
                    "timeline": "",
                    "skills": [],
                    "currency": "",
                    "location": "",
                }
        finally:
            await context.close()
            await browser.close()

        # Always include the URL and a combined description fallback
        parsed["url"] = url
        if not parsed.get("description"):
            parsed["description"] = _normalize_text(await page.content()) if 'page' in locals() else ""
        return parsed


# Usage:
# asyncio.run(scrape_job_posting('https://www.upwork.com/job/example'))
