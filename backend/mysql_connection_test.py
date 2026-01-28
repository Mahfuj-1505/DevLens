import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="devlens_db_user",
        password="DevlensUser@pass123",
        database="devlens_db"
    )
    print("Connection successful!")
    conn.close()
except mysql.connector.Error as err:
    print(f"Error: {err}")
