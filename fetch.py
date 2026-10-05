import sys
import requests
from db import create_table, save_day

BASE_URL = "https://russianwarship.rip/api/v2/statistics"
WAR_START = "2022-02-24"


def get_latest():
    response = requests.get(f"{BASE_URL}/latest")
    return response.json()["data"]


def backfill():
    # The history endpoint returns 50 days per page, so we move the
    # offset forward until a page comes back with fewer than 50.
    offset = 0
    while True:
        params = {"date_from": WAR_START, "offset": offset, "limit": 50}
        response = requests.get(BASE_URL, params=params)
        records = response.json()["data"]["records"]
        for record in records:
            save_day(record)
        print(f"saved {offset + len(records)} days")
        if len(records) < 50:
            break
        offset += 50


if __name__ == "__main__":
    create_table()
    if "--backfill" in sys.argv:
        backfill()
    else:
        day = get_latest()
        save_day(day)
        print(f"saved {day['date']} (day {day['day']})")
