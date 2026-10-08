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
10. v2: compare claimed (Ukraine) vs confirmed (Oryx) with oryx.py, a confirmed table and /compare.


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

v2: CLAIMED VS CONFIRMED
13. Second source: Oryx, because it only counts losses with a photo or video, so it is the opposite of the claimed figures: a minimum instead of an unverified total. Putting both side by side answers the question I got most: "is this real or just Ukraine's numbers?"
14. Oryx has no API, so oryx.py downloads the page and reads the category headers with a regex ("Tanks (4452, of which ..."). If no Tanks header is found it raises an error instead of saving an empty day, because a silent zero would look like real data.
15. A separate table (confirmed), not new columns in losses, because Oryx's categories are different (23 vs 15) and it only gives today's totals, not a history. I save one snapshot per day, so the history builds up from 8 Oct 2026.
16. Matching categories: each claimed category maps to the Oryx categories that count the same thing (armoured vehicles = AFVs + IFVs + APCs + MRAPs + infantry mobility vehicles). Personnel, drones and missiles are left out, because Oryx doesn't count them and a fake match would be worse than no match.
17. The ratio is claimed / confirmed. Close to 1 means both sources agree (ships 0.9×, helicopters 1.9×). Very high means the categories probably don't count the same things (artillery 30×, likely mortars and small guns; trucks 34×), so I show the number and don't explain it away.
18. In the GitHub Action, the Oryx step has continue-on-error, so if Oryx breaks, Ukraine's daily data still gets committed.
