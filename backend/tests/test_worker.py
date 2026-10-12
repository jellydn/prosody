"""Tests for the bounded analysis thread pool (app.worker)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
import pytest
from unittest.mock import patch

import app.worker as worker_module
from app.worker import AnalysisPool, AnalysisQueueFullError, get_pool, startup, shutdown


# ---------------------------------------------------------------------------
# AnalysisPool unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pool_runs_sync_function():
    pool = AnalysisPool(max_workers=2, max_queue=4)
    try:
        result = await pool.run(lambda: 42)
        assert result == 42
    finally:
        pool.shutdown()


@pytest.mark.asyncio
async def test_pool_passes_arguments():
    pool = AnalysisPool(max_workers=2, max_queue=4)
    try:
        result = await pool.run(lambda a, b: a + b, 3, 7)
        assert result == 10
    finally:
        pool.shutdown()


@pytest.mark.asyncio
async def test_pool_raises_on_full_queue():
    """Queue capacity = max_workers + max_queue.  Force exhaustion via semaphore."""
    pool = AnalysisPool(max_workers=1, max_queue=0)
    # Drain the single semaphore slot manually so the next run() sees a full queue.
    await pool._semaphore.acquire()
    try:
        with pytest.raises(AnalysisQueueFullError):
            await pool.run(lambda: None)
    finally:
        pool._semaphore.release()
        pool.shutdown()


# ---------------------------------------------------------------------------
# Module-level startup / shutdown helpers
# ---------------------------------------------------------------------------


def test_startup_creates_pool():
    original = worker_module._pool
    try:
        worker_module._pool = None
        startup()
        assert worker_module._pool is not None
        assert isinstance(worker_module._pool, AnalysisPool)
    finally:
        shutdown()
        worker_module._pool = original


def test_shutdown_clears_pool():
    worker_module._pool = None
    startup()
    shutdown()
    assert worker_module._pool is None


def test_get_pool_raises_when_not_started():
    original = worker_module._pool
    worker_module._pool = None
    try:
        with pytest.raises(RuntimeError, match="not initialized"):
            get_pool()
    finally:
        worker_module._pool = original


def test_get_pool_returns_pool_when_started():
    worker_module._pool = None
    try:
        startup()
        pool = get_pool()
        assert pool is worker_module._pool
    finally:
        shutdown()


# ---------------------------------------------------------------------------
# Configuration via environment variables
# ---------------------------------------------------------------------------


def test_startup_reads_env_vars():
    original = worker_module._pool
    try:
        worker_module._pool = None
        with patch.dict(
            os.environ, {"ANALYSIS_MAX_WORKERS": "2", "ANALYSIS_MAX_QUEUE": "5"}
        ):
            startup()
            pool = worker_module._pool
            assert pool._max_workers == 2
            assert pool._max_queue == 5
    finally:
        shutdown()
        worker_module._pool = original


def test_startup_uses_defaults_without_env_vars():
    original = worker_module._pool
    try:
        worker_module._pool = None
        env = {
            k: v
            for k, v in os.environ.items()
            if k not in ("ANALYSIS_MAX_WORKERS", "ANALYSIS_MAX_QUEUE")
        }
        with patch.dict(os.environ, env, clear=True):
            startup()
            pool = worker_module._pool
            assert pool._max_workers == 4
            assert pool._max_queue == 10
    finally:
        shutdown()
        worker_module._pool = original


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
