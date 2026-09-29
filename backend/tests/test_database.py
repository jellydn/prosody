from concurrent.futures import ThreadPoolExecutor
from io import StringIO
from pathlib import Path
import os

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.exc import TimeoutError
from sqlalchemy.pool import QueuePool

from app.models import User, create_database_engine
from sqlalchemy.orm import Session


@pytest.fixture(autouse=True)
def clear_pool_settings(monkeypatch):
    for name in ("DB_POOL_SIZE", "DB_MAX_OVERFLOW", "DB_POOL_TIMEOUT"):
        monkeypatch.delenv(name, raising=False)


@pytest.mark.parametrize("driver", ["postgresql", "postgresql+psycopg2"])
def test_postgresql_pool_defaults(driver):
    engine = create_database_engine(f"{driver}://user:password@localhost/test")
    try:
        assert engine.dialect.driver == "psycopg2"
        assert isinstance(engine.pool, QueuePool)
        assert engine.pool.size() == 5
        assert engine.pool._max_overflow == 5
        assert engine.pool.timeout() == 30
        assert engine.pool._pre_ping is True
    finally:
        engine.dispose()


def test_pool_overrides_bound_connections(monkeypatch):
    url = os.getenv("TEST_POSTGRES_URL")
    if not url:
        pytest.skip("Set TEST_POSTGRES_URL to an empty disposable PostgreSQL database")
    monkeypatch.setenv("DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    monkeypatch.setenv("DB_POOL_SIZE", "2")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "1")
    monkeypatch.setenv("DB_POOL_TIMEOUT", "1")
    engine = create_database_engine(url)
    connections = []
    try:
        assert engine.pool.size() == 2
        assert engine.pool.timeout() == 1
        connections = [engine.connect() for _ in range(3)]
        with pytest.raises(TimeoutError):
            engine.connect()
        connections.pop().close()
        with Session(engine) as session:
            user = User(native_language="vi", english_level="B1", goal="work")
            session.add(user)
            session.commit()
            session.refresh(user)
            assert user.id > 0
            assert user.native_language == "vi"
            session.delete(user)
            session.commit()
    finally:
        for connection in connections:
            connection.close()
        engine.dispose()


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("DB_POOL_SIZE", "0"),
        ("DB_POOL_SIZE", "-1"),
        ("DB_MAX_OVERFLOW", "-1"),
        ("DB_POOL_TIMEOUT", "0"),
        ("DB_POOL_TIMEOUT", "-1"),
        ("DB_POOL_SIZE", "invalid"),
        ("DB_POOL_TIMEOUT", "1.5"),
    ],
)
def test_invalid_pool_settings_fail_early(monkeypatch, name, value):
    monkeypatch.setenv(name, value)
    with pytest.raises(ValueError, match=name):
        create_database_engine("postgresql://user:password@localhost/test")


def test_zero_overflow_is_allowed(monkeypatch):
    monkeypatch.setenv("DB_MAX_OVERFLOW", "0")
    engine = create_database_engine("postgresql://user:password@localhost/test")
    assert engine.pool._max_overflow == 0
    engine.dispose()


@pytest.mark.parametrize("url", ["sqlite://", "sqlite+pysqlite://"])
def test_sqlite_ignores_postgresql_settings_and_allows_threads(monkeypatch, url):
    monkeypatch.setenv("DB_POOL_SIZE", "invalid")
    engine = create_database_engine(url)
    try:
        with engine.connect() as connection, ThreadPoolExecutor() as executor:
            assert executor.submit(connection.scalar, text("SELECT 7")).result() == 7
    finally:
        engine.dispose()


def test_postgresql_migration_sql_with_encoded_password(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:p%25ss%40word@localhost/test")
    output = StringIO()
    config = Config(
        str(Path(__file__).parents[1] / "alembic.ini"), output_buffer=output
    )
    command.upgrade(config, "head", sql=True)
    sql = output.getvalue()
    assert "CREATE TABLE users" in sql
    assert "CREATE TABLE session_results" in sql
    assert "SERIAL" in sql
    assert "FOREIGN KEY(user_id) REFERENCES users (id)" in sql
