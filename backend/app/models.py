from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.engine import make_url
from datetime import datetime, timezone
import os


class Base(DeclarativeBase):
    pass


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")


def _pool_setting(name: str, default: int, minimum: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        raise ValueError(f"{name} must be an integer >= {minimum}") from None
    if value < minimum:
        raise ValueError(f"{name} must be an integer >= {minimum}")
    return value


def create_database_engine(database_url: str):
    backend = make_url(database_url).get_backend_name()
    if backend == "sqlite":
        return create_engine(database_url, connect_args={"check_same_thread": False})
    if backend == "postgresql":
        return create_engine(
            database_url,
            pool_size=_pool_setting("DB_POOL_SIZE", 5, 1),
            max_overflow=_pool_setting("DB_MAX_OVERFLOW", 5, 0),
            pool_timeout=_pool_setting("DB_POOL_TIMEOUT", 30, 1),
            pool_pre_ping=True,
        )
    return create_engine(database_url)


engine = create_database_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    native_language = Column(String, nullable=False)
    english_level = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SessionResult(Base):
    __tablename__ = "session_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day = Column(Integer, nullable=False)
    exercises_completed = Column(Integer, nullable=False)
    rhythm_score = Column(Float, nullable=False)
    stress_score = Column(Float, nullable=False)
    pacing_score = Column(Float, nullable=False)
    intonation_score = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def _ensure_sqlite_dir() -> None:
    """Create the SQLite database directory if it does not exist."""
    if DATABASE_URL.startswith("sqlite"):
        db_dir = os.path.dirname(DATABASE_URL.replace("sqlite:///", ""))
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)


def run_migrations() -> None:
    """Apply all pending Alembic migrations (upgrade to head)."""
    from alembic.config import Config
    from alembic import command

    _ensure_sqlite_dir()
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    command.upgrade(alembic_cfg, "head")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
