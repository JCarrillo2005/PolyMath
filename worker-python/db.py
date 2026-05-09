import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    conn_str = os.getenv('DB_CONNECTION_STRING')
    if not conn_str:
        conn_str = (
            "Driver={ODBC Driver 17 for SQL Server};"
            "Server=localhost;"
            "Database=PolyMathDB;"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
    return pyodbc.connect(conn_str)