import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.models import init_db, SessionLocal


@pytest.fixture
def db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
