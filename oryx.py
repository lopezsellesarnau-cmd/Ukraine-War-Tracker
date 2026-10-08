import re
import html
from datetime import date
import requests
from db import create_confirmed_table, save_confirmed

# Oryx lists every Russian loss confirmed by a photo or video, one page,
# no API. Each category header looks like:
# "Tanks (4452, of which destroyed: 3357, damaged: 165, ...)"
ORYX_URL = "https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html"
HEADER = re.compile(r"([A-Z][A-Za-z ()/-]{2,70}?) \((\d+), of which")


def get_confirmed():
    response = requests.get(ORYX_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
    response.raise_for_status()
    # Strip the HTML tags so the headers become plain text.
    text = re.sub(r"<[^>]+>", " ", response.text)
    text = html.unescape(re.sub(r"\s+", " ", text))
    totals = {name.strip(): int(total) for name, total in HEADER.findall(text)}
    # If the page layout changes and nothing matches, fail loudly
    # instead of saving an empty day.
    if "Tanks" not in totals:
        raise ValueError("Oryx page format changed: no Tanks header found")
    return totals


if __name__ == "__main__":
    create_confirmed_table()
    totals = get_confirmed()
    save_confirmed(date.today().isoformat(), totals)
    print(f"saved {len(totals)} Oryx categories, tanks: {totals['Tanks']}")
