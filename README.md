# Ukraine War Tracker

A daily tracker of Russian equipment and personnel losses in the war in Ukraine.

The figures come from the daily reports of Ukraine's General Staff, through the russianwarship.rip API. They are claimed by one side of the war and not independently verified, and the site labels them that way.

## Why I built it

It started from my passion for geopolitics and the need to know what is happening in the world and why. I also want to show people, in Europe and around the world, the scale of this war and what we could face if it stops being someone else's problem. The site shows the destruction and the losses, day after day, on a minimal and clear page.

## How it works

1. `fetch.py` calls the API and saves the latest report (or the whole history with `--backfill`).
2. `db.py` stores it in SQLite (`losses.db`), one row per day and category.
3. `main.py` is a FastAPI backend with two endpoints: `/latest` and `/history/{category}`.
4. `static/` is the frontend in plain HTML, CSS and JS, with a Chart.js line chart.
5. A GitHub Action runs `fetch.py` every day and commits the new data.

## Run it locally

```
uv sync
uv run fetch.py --backfill   # first time only
uv run uvicorn main:app --reload
```

Then open http://localhost:8000.

## Stack

Python, FastAPI, SQLite, HTML, CSS, JavaScript, Chart.js, GitHub Actions.

Built by Arnau López.
