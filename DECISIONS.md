STEPS
1. uv init
2. Create the DECISIONS file.
3. Create fetch.py to access the data from the source (https://russianwarship.rip/api/v2/statistics/latest)
4. Backfill the history once
5. Create the db.py file to store the data with sqlite3
6. Build the backend on main.py with FastAPI.
7. Run it daily with GitHub Actions.
8. Build the frontend on /static (HTML, CSS, JS).
9. Deploy and record the video.


DECISIONS
1. Source: russianwarship.rip, because it has today's data, needs no key and has a history endpoint. PetroIvaniuk runs a day behind, and Oryx has no API.
2. These are figures claimed by Ukraine's General Staff, not verified ones, so the site has to label them that way.
3. No .env, because there are no secrets.
4. Backfill with pagination: the history endpoint returns 50 days per page, so fetch.py moves the offset forward until a page has fewer than 50. Run once with `uv run fetch.py --backfill`.
5. One table, one row per day and category (date, category, total, increase). The primary key is (date, category) and I use INSERT OR REPLACE, so running the fetch twice on the same day never creates duplicates. In the job tracker I had to fix duplicates later; here I avoided them from the start.
6. I store both the total and the daily increase because the API gives both. Recalculating the increase from totals would break on days the source skipped.
7. Two endpoints: /latest (the latest report, one row per category) and /history/{category} (the full series for the chart). The frontend only asks for what it shows.
8. The chart shows the cumulative total, not the daily increase. Daily numbers are noisy and hard to read over four years; the total shows the trend.
9. Chart.js from a CDN, same as planned in the job tracker. No build step, no framework.
10. Daily updates with GitHub Actions at 12:00 UTC: it runs fetch.py and commits losses.db. losses.db is in git on purpose, because Vercel can't write to disk, so the database has to arrive with the code.
11. Design: my "espacio abierto" minimal style (same as my portfolio). One screen per section, small uppercase text, mono only for numbers and dates, no borders or shadows, separated by space, not lines. The only colour is rust on hover. For a war tracker, the empty space makes the numbers weigh more; it should feel like a quiet report, not a dashboard.
12. The headline number is personnel, because it is the figure that sets the scale. The three notes are today's personnel, drones and artillery: the biggest daily movers.
