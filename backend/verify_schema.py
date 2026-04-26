import sqlite3

conn = sqlite3.connect('stroik.db')
cursor = conn.cursor()

# Get table schema
cursor.execute("PRAGMA table_info(profiles)")
columns = cursor.fetchall()

print("Current profiles table schema:")
print("-" * 80)
for col in columns:
    col_id, name, dtype, notnull, default, pk = col
    print(f"  {name:30} {dtype:20} {'NOT NULL' if notnull else 'nullable':10}")

conn.close()
