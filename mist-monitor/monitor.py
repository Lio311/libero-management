#!/usr/bin/env python3
"""
MIST Back-in-Stock Monitor
===========================
Monitors https://mist.co.il/collections/back-in-stock for new products
and sends an immediate email alert when something new appears.

Usage:
    python3 monitor.py

Configuration:
    Edit the CONFIG section below or set environment variables.
"""

import json
import os
import sys
import time
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

# ─────────────────────────── CONFIG ───────────────────────────

COLLECTION_URL = "https://mist.co.il/collections/back-in-stock/products.json?limit=250"
POLL_INTERVAL_SECONDS = 30  # How often to check (seconds)

# Email settings
EMAIL_TO = "lior31197@gmail.com"
EMAIL_FROM = os.environ.get("GMAIL_ADDRESS", "")  # Your Gmail address
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")  # Gmail App Password

# State file - stores known product IDs between runs
STATE_FILE = Path(__file__).parent / "known_products.json"

# ─────────────────────────── LOGGING ───────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("mist-monitor")

# ─────────────────────────── HELPERS ───────────────────────────


def fetch_products() -> list[dict]:
    """Fetch all products from the back-in-stock collection."""
    req = Request(COLLECTION_URL, headers={"User-Agent": "MistMonitor/1.0"})
    with urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return data.get("products", [])


def load_known_ids() -> set:
    """Load previously seen product IDs from disk."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return set(json.load(f))
    return set()


def save_known_ids(ids: set):
    """Persist known product IDs to disk."""
    with open(STATE_FILE, "w") as f:
        json.dump(sorted(ids), f)


def format_price(price: str) -> str:
    """Format price string."""
    try:
        return f"₪{float(price):,.0f}"
    except (ValueError, TypeError):
        return price or "N/A"


def build_email_html(new_products: list[dict]) -> str:
    """Build a rich HTML email body for the new products."""
    count = len(new_products)
    product_cards = ""

    for p in new_products:
        title = p.get("title", "Unknown")
        vendor = p.get("vendor", "")
        product_type = p.get("product_type", "")
        handle = p.get("handle", "")
        url = f"https://mist.co.il/products/{handle}"

        # Get image
        images = p.get("images", [])
        img_src = images[0].get("src", "") if images else ""
        img_html = f'<img src="{img_src}" width="120" style="border-radius:8px;" />' if img_src else ""

        # Get price from first variant
        variants = p.get("variants", [])
        price = format_price(variants[0].get("price", "")) if variants else "N/A"

        product_cards += f"""
        <div style="display:flex; gap:16px; padding:16px; margin:12px 0;
                    background:#f8f9fa; border-radius:12px; border:1px solid #e9ecef;
                    direction:rtl; text-align:right;">
            <div style="flex-shrink:0;">{img_html}</div>
            <div style="flex:1;">
                <h3 style="margin:0 0 6px 0; color:#1a1a2e; font-size:16px;">{title}</h3>
                <p style="margin:0 0 4px 0; color:#666; font-size:13px;">{vendor} &bull; {product_type}</p>
                <p style="margin:0 0 10px 0; font-size:20px; font-weight:bold; color:#c6b279;">{price}</p>
                <a href="{url}" style="display:inline-block; padding:8px 20px;
                   background:#1a1a2e; color:white; text-decoration:none;
                   border-radius:6px; font-size:13px;">לצפייה במוצר →</a>
            </div>
        </div>
        """

    return f"""
    <html dir="rtl">
    <body style="font-family: -apple-system, Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
        <div style="text-align:center; padding:20px 0;">
            <h1 style="color:#1a1a2e; margin:0;">🚨 MIST — מוצר חדש במלאי!</h1>
            <p style="color:#666; font-size:14px;">{count} מוצר{"ים" if count > 1 else ""} חדש{"ים" if count > 1 else ""} &bull; {datetime.now().strftime("%H:%M:%S %d/%m/%Y")}</p>
        </div>
        {product_cards}
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
        <p style="text-align:center; color:#999; font-size:11px;">
            MIST Monitor &bull; בדיקה כל {POLL_INTERVAL_SECONDS} שניות
        </p>
    </body>
    </html>
    """


def send_email(new_products: list[dict]):
    """Send an email alert about new products."""
    if not EMAIL_FROM or not GMAIL_APP_PASSWORD:
        log.error("❌ חסרים פרטי Gmail! הגדר GMAIL_ADDRESS ו-GMAIL_APP_PASSWORD")
        log.error("   ראה הוראות בקובץ README.md")
        # Still log the products even if email fails
        for p in new_products:
            log.info(f"   🛒 {p.get('title')} — https://mist.co.il/products/{p.get('handle')}")
        return False

    count = len(new_products)
    titles = ", ".join(p.get("title", "?")[:30] for p in new_products[:3])
    if count > 3:
        titles += f" (+{count - 3} עוד)"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🚨 MIST — {count} מוצר חדש: {titles}"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO

    html = build_email_html(new_products)
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_FROM, GMAIL_APP_PASSWORD)
            server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
        log.info(f"📧 מייל נשלח ל-{EMAIL_TO}")
        return True
    except smtplib.SMTPAuthenticationError:
        log.error("❌ שגיאת אימות Gmail — בדוק שה-App Password נכון")
        return False
    except Exception as e:
        log.error(f"❌ שגיאה בשליחת מייל: {e}")
        return False


# ─────────────────────────── MAIN LOOP ───────────────────────────


def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   🔍  MIST Back-in-Stock Monitor  🔍    ║")
    print("  ╠══════════════════════════════════════════╣")
    print(f"  ║  📧 מייל ל: {EMAIL_TO:<28s}║")
    print(f"  ║  ⏱  בדיקה כל {POLL_INTERVAL_SECONDS} שניות{' ' * 21}║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    if not EMAIL_FROM or not GMAIL_APP_PASSWORD:
        print("  ⚠️  לא הוגדרו פרטי Gmail — המייל לא ישלח!")
        print("  ℹ️  הרץ עם:")
        print(f"     GMAIL_ADDRESS=your@gmail.com GMAIL_APP_PASSWORD=xxxx python3 {sys.argv[0]}")
        print("  ℹ️  או ראה README.md להוראות מלאות")
        print()

    # Load known products
    known_ids = load_known_ids()
    first_run = len(known_ids) == 0

    if first_run:
        log.info("🚀 ריצה ראשונה — לומד מוצרים קיימים...")

    errors_in_a_row = 0

    while True:
        try:
            products = fetch_products()
            current_ids = {p["id"] for p in products}

            if first_run:
                # First run — just store everything, don't alert
                save_known_ids(current_ids)
                log.info(f"✅ נשמרו {len(current_ids)} מוצרים קיימים. מתחיל לעקוב...")
                first_run = False
            else:
                new_ids = current_ids - known_ids
                if new_ids:
                    new_products = [p for p in products if p["id"] in new_ids]
                    log.info(f"🆕 נמצאו {len(new_products)} מוצרים חדשים!")
                    for p in new_products:
                        log.info(f"   → {p.get('title')} ({format_price(p.get('variants', [{}])[0].get('price', ''))})")

                    send_email(new_products)

                    # Update known IDs
                    known_ids.update(new_ids)
                    save_known_ids(known_ids)
                else:
                    log.info(f"😴 אין חדש ({len(current_ids)} מוצרים)")

            errors_in_a_row = 0

        except URLError as e:
            errors_in_a_row += 1
            log.warning(f"⚠️  שגיאת רשת ({errors_in_a_row}): {e}")
            if errors_in_a_row >= 10:
                log.error("❌ 10 שגיאות רצופות — בודק שוב בעוד 5 דקות")
                time.sleep(300)
                errors_in_a_row = 0
                continue

        except KeyboardInterrupt:
            print("\n\n  👋 המוניטור נעצר. להתראות!\n")
            sys.exit(0)

        except Exception as e:
            errors_in_a_row += 1
            log.error(f"❌ שגיאה: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
