import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Abre una conexión nueva — cada request la cierra al terminar."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_DATABASE"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
        cursor_factory=psycopg2.extras.RealDictCursor,  # filas como dicts
    )
