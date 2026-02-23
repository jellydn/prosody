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
from datetime import datetime, timezone
import os


class Base(DeclarativeBase):
    pass


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")

engine_connect_args = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
engine = create_engine(DATABASE_URL, connect_args=engine_connect_args)
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


def init_db():
    if DATABASE_URL.startswith("sqlite"):
        db_dir = os.path.dirname(DATABASE_URL.replace("sqlite:///", ""))
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
