# Database Migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database schema migrations.

Migration scripts live in `backend/migrations/versions/`.

---

## Configuration

The database URL is read from the `DATABASE_URL` environment variable at runtime.
If it is not set, Alembic falls back to `sqlite:///./data/app.db` (the local dev default).

Set it in your `.env` file (see `.env.example`):

```env
DATABASE_URL=sqlite:///./backend/data/app.db
```

For staging/production, use a full connection string, e.g.:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## Running Migrations

Apply all pending migrations (upgrade to the latest revision):

```bash
just backend-migrate
# or directly:
cd backend && uv run alembic upgrade head
```

The backend also runs `alembic upgrade head` automatically at startup via the FastAPI lifespan hook, so the schema is always up-to-date when the server starts.

---

## Creating a New Migration

After changing models in `backend/app/models.py`, generate a new migration:

```bash
just backend-migrate-create "short description of change"
# or directly:
cd backend && uv run alembic revision --autogenerate -m "short description of change"
```

Review the generated file in `backend/migrations/versions/` before committing. Autogenerate is not always perfect — verify the `upgrade()` and `downgrade()` functions are correct.

---

## Rolling Back a Migration

Downgrade by one revision:

```bash
just backend-migrate-rollback
# or directly:
cd backend && uv run alembic downgrade -1
```

To downgrade to a specific revision:

```bash
cd backend && uv run alembic downgrade <revision_id>
```

To roll back all migrations:

```bash
cd backend && uv run alembic downgrade base
```

---

## Checking Migration Status

```bash
# Show the current applied revision
cd backend && uv run alembic current

# Show the full migration history
cd backend && uv run alembic history
```

---

## Notes for Contributors

- Always commit migration files alongside model changes — do not edit existing migration files once they are merged.
- Migration filenames follow the pattern `<revision_id>_<slug>.py`.
- The `alembic.ini` file lives in `backend/` and the migration scripts are in `backend/migrations/versions/`.
