import os
import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

_pool: ThreadedConnectionPool | None = None


def _build_pool() -> ThreadedConnectionPool:
    # Si se define DATABASE_URL (p.ej. el pooler IPv4 de Supabase), se usa tal cual.
    # Si no, se arma con las variables sueltas (conexión directa).
    database_url = os.getenv("DATABASE_URL")
    common = dict(
        minconn=1,
        maxconn=10,
        cursor_factory=psycopg2.extras.RealDictCursor,
        connect_timeout=10,
    )
    if database_url:
        return ThreadedConnectionPool(dsn=database_url, **common)

    return ThreadedConnectionPool(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_DATABASE"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
        **common,
    )


def init_pool() -> None:
    """Intenta crear el pool al arrancar. Si la BD no responde, no tumba el
    servicio: se reintenta de forma perezosa en el primer get_connection()."""
    global _pool
    try:
        _pool = _build_pool()
    except Exception as e:
        _pool = None
        print(f"⚠️  No se pudo conectar a la BD al arrancar: {e}. Se reintentará bajo demanda.")


@contextmanager
def get_connection():
    global _pool
    if _pool is None:
        _pool = _build_pool()  # reintento perezoso; si falla, propaga el error
    conn = _pool.getconn()
    try:
        yield conn
    finally:
        _pool.putconn(conn)
