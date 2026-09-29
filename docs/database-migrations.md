# Database Migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database schema migrations.

Migration scripts live in `backend/migrations/versions/`.

---

## Configuration

The database URL is read from the `DATABASE_URL` environment variable at runtime.
If it is not set, Alembic falls back to `sqlite:///./data/app.db` (the local dev default).

Export it in the backend process environment (see `.env.example`). The application
and Alembic do not automatically load the root `.env` file:

```env
DATABASE_URL=sqlite:///./data/app.db
```

For staging/production, use a full connection string, e.g.:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=verify-full
RUN_MIGRATIONS_ON_STARTUP=false
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=5
DB_POOL_TIMEOUT=30
```

The installed `psycopg2-binary` driver supports `postgresql://` and
`postgresql+psycopg2://`. Use these prefixes, not `postgres://`. URL-encode special
characters in credentials (for example, `@` becomes `%40`). Store credentials in
the deployment secret store, never in source control or logs. Use the provider's
TLS settings and CA certificate; `verify-full` checks the server certificate and
hostname and requires a trusted CA (`sslrootcert` can specify its path).

PostgreSQL pools keep up to `DB_POOL_SIZE` connections, allow `DB_MAX_OVERFLOW`
extra connections during bursts, and wait up to `DB_POOL_TIMEOUT` seconds when
the pool is full. Defaults are 5, 5, and 30. All values must be integers. Size and
timeout must be at least 1; overflow can be 0 but cannot be negative. This avoids
SQLAlchemy's unlimited-pool settings. Connections open on demand, and a pre-ping
checks each reused connection. It does not retry failed transactions.

The limit is **per process**, not per deployment. Budget at most
`instances × workers × (DB_POOL_SIZE + DB_MAX_OVERFLOW)` application connections,
plus room for migrations, operators, other clients, and rolling deployments.
For example, 2 instances with 2 workers each can use 40 connections by default.
Tune these values below the provider's connection limit. Pool timeout is not a
network connection timeout; use the PostgreSQL URL's `connect_timeout` option
if needed. SQLite keeps its existing thread-compatible connection setup and
ignores these pool variables. Alembic uses `NullPool` for its separate connection.

### Production deployment

1. Provision PostgreSQL and verify network access, TLS, backups, and the connection
   budget. Install the locked dependencies with `uv sync --frozen --no-dev`.
2. Set `DATABASE_URL` in the runtime and migration job secret environment. Set
   `RUN_MIGRATIONS_ON_STARTUP=false` on every application worker.
3. Obtain approval before changing a shared database. Run one migration job with
   `uv run alembic upgrade head` from `backend/`, then check `uv run alembic current`.
   The migration role needs schema creation privileges. The runtime role needs
   table read/write and sequence usage privileges if a separate role is used.
4. Start workers only after the migration succeeds. Verify user creation, session
   writes, and progress reads. `/health` alone does not check database access.

`backend/fly.toml` still describes the existing SQLite deployment. For an approved
PostgreSQL rollout, remove its SQLite `DATABASE_URL` entry, supply the PostgreSQL
URL as a Fly secret, and set startup migrations to false. Run a single release
migration before workers start. Keep the SQLite volume and backup until the
rollback window closes; do not delete them as part of the initial switch.

### Moving existing SQLite data

Changing `DATABASE_URL` does **not** copy records. Alembic creates the schema but
does not transfer users or session history. Rehearse this procedure on disposable
copies before an approved maintenance window:

1. Stop writes and all automatic migration processes. Take a consistent SQLite
   backup with SQLite's backup command/API (include WAL state; do not copy only an
   active `.db` file). Record row counts and retain the original volume.
2. Create an empty PostgreSQL database and run `alembic upgrade head` against it.
3. Export `users` and `session_results` from the backup with explicit columns.
   Import **data only**, users first, then sessions, using a reviewed transfer tool
   or script and a transaction. Preserve primary keys, foreign keys, nulls, scores,
   and timestamps. Existing naive timestamps represent UTC; do not shift them.
   Do not import SQLite schema SQL or its `alembic_version` table.
4. Reset PostgreSQL ID sequences after importing explicit IDs:

   ```sql
   SELECT setval(pg_get_serial_sequence('users', 'id'),
                 COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM users;
   SELECT setval(pg_get_serial_sequence('session_results', 'id'),
                 COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM session_results;
   ```

5. Compare row counts, IDs, relationships, timestamps, and sample progress totals.
   Test new user and session writes to check sequences and constraints. Only then
   switch all workers to PostgreSQL and re-enable traffic.
6. Before PostgreSQL accepts new writes, rollback can point all workers at the
   retained SQLite backup. After new writes, stop traffic and reconcile/export
   those records first; switching back directly loses data. An Alembic downgrade
   is not a data-transfer rollback.

For a development database with no data to retain, skip the export/import steps
and use a new migrated PostgreSQL database.

### PostgreSQL test coverage

CI starts a disposable PostgreSQL 16 service. The backend tests apply migrations,
write/read a user, exhaust a small pool, and verify it recovers after a connection
is returned. To run that check locally, set `TEST_POSTGRES_URL` to an **empty,
disposable** PostgreSQL database and run `uv run pytest tests/test_database.py`
from `backend/`. Never point this variable at a shared or production database.
Without it, the live test is skipped; driver, pool configuration, invalid-value,
SQLite compatibility, and PostgreSQL migration SQL tests still run.

---

## Running Migrations

Apply all pending migrations (upgrade to the latest revision):

```bash
just backend-migrate
# or directly:
cd backend && uv run alembic upgrade head
```

The backend can run `alembic upgrade head` automatically at startup via the FastAPI lifespan hook. This is controlled by `RUN_MIGRATIONS_ON_STARTUP` (default: `true`).

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
