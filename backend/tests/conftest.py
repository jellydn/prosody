import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models as models


@pytest.fixture
def db(tmp_path_factory):
    previous_database_url = os.environ.get("DATABASE_URL")
    test_db_dir = tmp_path_factory.mktemp("db")
    test_db_path = test_db_dir / "test.db"
    test_database_url = f"sqlite:///{test_db_path}"

    os.environ["DATABASE_URL"] = test_database_url

    models.DATABASE_URL = test_database_url
    models.engine.dispose()
    models.engine = create_engine(
        test_database_url,
        connect_args={"check_same_thread": False},
    )
    models.SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=models.engine,
    )

    models.run_migrations()
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()
        models.engine.dispose()
        if previous_database_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_database_url
