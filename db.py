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
