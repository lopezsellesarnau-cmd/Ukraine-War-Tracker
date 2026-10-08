import sqlite3

DB_FILE = "losses.db"


def create_table():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS losses (
        date TEXT,
        category TEXT,
        total INTEGER,
        increase INTEGER,
        PRIMARY KEY (date, category)
        )
    """)
    conn.commit()
    conn.close()


def save_day(record):
    # One row per category. INSERT OR REPLACE + the primary key means
    # running fetch.py twice on the same day never creates duplicates.
    conn = sqlite3.connect(DB_FILE)
    for category, total in record["stats"].items():
        conn.execute(
            "INSERT OR REPLACE INTO losses (date, category, total, increase) VALUES (?, ?, ?, ?)",
            (record["date"], category, total, record["increase"][category])
        )
    conn.commit()
    conn.close()


def get_latest():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT date, category, total, increase FROM losses
        WHERE date = (SELECT MAX(date) FROM losses)
        ORDER BY total DESC
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_history(category):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT date, total, increase FROM losses WHERE category = ? ORDER BY date",
        (category,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ---------- Confirmed losses (Oryx) ----------

def create_confirmed_table():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS confirmed (
        date TEXT,
        category TEXT,
        total INTEGER,
        PRIMARY KEY (date, category)
        )
    """)
    conn.commit()
    conn.close()


def save_confirmed(day, totals):
    conn = sqlite3.connect(DB_FILE)
    for category, total in totals.items():
        conn.execute(
            "INSERT OR REPLACE INTO confirmed (date, category, total) VALUES (?, ?, ?)",
            (day, category, total)
        )
    conn.commit()
    conn.close()


# Ukraine and Oryx don't use the same categories, so each claimed category
# is matched to the Oryx categories that count the same kind of equipment.
# Categories with no fair match (personnel, drones, missiles) are left out.
MATCHES = {
    "tanks": ["Tanks"],
    "armoured_fighting_vehicles": [
        "Armoured Fighting Vehicles", "Infantry Fighting Vehicles",
        "Armoured Personnel Carriers", "Mine-Resistant Ambush Protected (MRAP) Vehicles",
        "Infantry Mobility Vehicles",
    ],
    "artillery_systems": ["Towed Artillery", "Self-Propelled Artillery"],
    "mlrs": ["Rocket and Missile Artillery"],
    "aa_warfare_systems": [
        "Surface-To-Air Missile Systems", "Self-Propelled Anti-Aircraft Guns", "Anti-Aircraft Guns",
    ],
    "planes": ["Aircraft"],
    "helicopters": ["Helicopters"],
    "warships_cutters": ["Naval Ships and Submarines"],
    "vehicles_fuel_tanks": ["Trucks and similar vehicles"],
}


def get_compare():
    conn = sqlite3.connect(DB_FILE)
    claimed = dict(conn.execute(
        "SELECT category, total FROM losses WHERE date = (SELECT MAX(date) FROM losses)"
    ).fetchall())
    confirmed_date = conn.execute("SELECT MAX(date) FROM confirmed").fetchone()[0]
    confirmed = dict(conn.execute(
        "SELECT category, total FROM confirmed WHERE date = ?", (confirmed_date,)
    ).fetchall())
    conn.close()

    rows = []
    for category, oryx_categories in MATCHES.items():
        claimed_total = claimed.get(category, 0)
        # Oryx counts ships and submarines together, so Ukraine's two do too.
        if category == "warships_cutters":
            claimed_total += claimed.get("submarines", 0)
        confirmed_total = sum(confirmed.get(name, 0) for name in oryx_categories)
        rows.append({
            "category": category,
            "claimed": claimed_total,
            "confirmed": confirmed_total,
            "ratio": round(claimed_total / confirmed_total, 1) if confirmed_total else None,
        })
    return {"confirmed_date": confirmed_date, "rows": rows}
