# English Rhythm Coach - Justfile

# Default recipe
default:
    @just --list

# Backend commands
backend-install:
    cd backend && pip install -r requirements.txt

backend-dev:
    cd backend && uvicorn app.main:app --reload

backend-test:
    cd backend && pytest -v

backend-test-single TEST:
    cd backend && pytest -k "{{TEST}}"

backend-test-file FILE:
    cd backend && pytest {{FILE}} -v

backend-lint:
    cd backend && ruff check . && ruff format .

backend-schema:
    cd backend && python ../scripts/generate_schema.py

# Mobile commands
mobile-install:
    cd mobile && npx expo install

mobile-dev:
    cd mobile && npx expo start

mobile-typecheck:
    cd mobile && npx tsc --noEmit

mobile-lint:
    cd mobile && oxlint .

mobile-format:
    cd mobile && oxfmt .

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
check-backend: backend-lint backend-test
check-mobile: mobile-typecheck mobile-lint

check: check-backend check-mobile

# Clean commands
clean-backend:
    cd backend && rm -rf .pytest_cache __pycache__ app/__pycache__ app/**/__pycache__

clean-mobile:
    cd mobile && rm -rf node_modules/.cache

clean: clean-backend clean-mobile
