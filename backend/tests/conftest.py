import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.models import run_migrations, SessionLocal


@pytest.fixture
def db():
    run_migrations()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
