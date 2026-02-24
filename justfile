# English Rhythm Coach - Justfile

# Default recipe
default:
    @just --list

# Install all dependencies
install:
    just backend-install
    just mobile-install

# Backend commands
backend-install:
    cd backend && uv sync --dev --frozen

backend-lock-check:
    cd backend && uv lock --check

backend-dev:
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

backend-test:
    cd backend && uv run pytest -v

backend-test-single TEST:
    cd backend && uv run pytest -k "{{TEST}}"

backend-test-file FILE:
    cd backend && uv run pytest {{FILE}} -v

backend-lint:
    cd backend && uv run ruff check . && uv run ruff format .

backend-schema:
    cd backend && uv run python ../scripts/generate_schema.py

backend-fly-deploy:
    cd backend && fly deploy

backend-fly-logs:
    cd backend && fly logs

# Mobile commands
mobile-install:
    cd mobile && npm install

mobile-dev:
    cd mobile && npx expo start

mobile-typecheck:
    cd mobile && npx tsc --noEmit

mobile-lint:
    cd mobile && npx oxlint .

mobile-lint-fix:
    cd mobile && npx oxlint --fix .

mobile-format:
    cd mobile && npx oxfmt .

mobile-format-check:
    cd mobile && npx oxfmt --check .

mobile-test:
    cd mobile && npx jest

mobile-test-single TEST:
    cd mobile && npx jest --testNamePattern="{{TEST}}"

mobile-test-file FILE:
    cd mobile && npx jest --testPathPattern="{{FILE}}"

# Development commands
dev: backend-dev mobile-dev
    echo "Started both backend and mobile dev servers"

# Quality checks
check-backend: backend-lock-check backend-lint backend-test
check-mobile: mobile-typecheck mobile-lint

check: check-backend check-mobile

# CI (runs all checks, same as GitHub Actions)
ci: install check

# Clean commands
clean-backend:
    cd backend && rm -rf .pytest_cache __pycache__ app/__pycache__ app/**/__pycache__

clean-mobile:
    cd mobile && rm -rf node_modules/.cache

clean: clean-backend clean-mobile
