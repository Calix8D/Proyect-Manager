import os
import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

_pool: ThreadedConnectionPool | None = None


def init_pool() -> None:
    global _pool
    _pool = ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_DATABASE"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
        cursor_factory=psycopg2.extras.RealDictCursor,
    )


@contextmanager
def get_connection():
    conn = _pool.getconn()
    try:
        yield conn
    finally:
        _pool.putconn(conn)
