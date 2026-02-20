import sqlite3
import os

DB_PATH = "/opt/finance/backend/db.sqlite3"
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("Starting migration...")

# 1. Rename projects → commitments
try:
    c.execute("ALTER TABLE projects RENAME TO commitments")
    print("✓ Renamed projects → commitments")
except Exception as e:
    print(f"  commitments table already exists or rename failed: {e}")

# 2. Add monthly_budget to commitments (copy from budget)
try:
    c.execute("ALTER TABLE commitments ADD COLUMN monthly_budget REAL DEFAULT 0.0")
    c.execute("UPDATE commitments SET monthly_budget = budget")
    print("✓ Added monthly_budget to commitments")
except Exception as e:
    print(f"  monthly_budget already exists: {e}")

# 3. Create incomes table
c.execute("""
    CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        source VARCHAR DEFAULT 'Salary',
        description VARCHAR NOT NULL,
        date VARCHAR NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("✓ Created incomes table")

# 4. Create goal_allocations table
c.execute("""
    CREATE TABLE IF NOT EXISTS goal_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        date VARCHAR NOT NULL,
        note VARCHAR DEFAULT '',
        goal_id INTEGER REFERENCES goals(id),
        income_id INTEGER REFERENCES incomes(id),
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("✓ Created goal_allocations table")

# 5. Add monthly_target to goals
try:
    c.execute("ALTER TABLE goals ADD COLUMN monthly_target REAL DEFAULT 0.0")
    print("✓ Added monthly_target to goals")
except Exception as e:
    print(f"  monthly_target already exists: {e}")

conn.commit()
conn.close()
print("\nMigration complete.")
