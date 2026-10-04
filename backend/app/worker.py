"""Bounded thread-pool for CPU-heavy audio analysis work.

Configure via environment variables:
    ANALYSIS_MAX_WORKERS  – concurrent worker threads  (default: 4)
    ANALYSIS_MAX_QUEUE    – max additional waiting tasks (default: 10)

Requests that arrive when both the workers and the queue are full receive
an :class:`AnalysisQueueFullError` so the HTTP layer can return 503.
"""

import asyncio
import concurrent.futures
import logging
import os
from typing import Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")

_pool: "AnalysisPool | None" = None


class AnalysisQueueFullError(RuntimeError):
    """Raised when the analysis pool has no capacity for new tasks."""


class AnalysisPool:
    """Bounded thread pool for synchronous analysis work.

    At most *max_workers* tasks run concurrently; up to *max_queue* additional
    tasks may wait.  Tasks beyond that limit raise :class:`AnalysisQueueFullError`
    immediately instead of queuing indefinitely.
    """

    def __init__(self, max_workers: int, max_queue: int) -> None:
        self._executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="analysis"
        )
        # Semaphore capacity = running + waiting slots
        self._semaphore = asyncio.Semaphore(max_workers + max_queue)
        self._max_workers = max_workers
        self._max_queue = max_queue

    async def run(self, fn: Callable[..., T], *args: object) -> T:
        """Run *fn* in the thread pool, respecting the queue limit.

        Raises :class:`AnalysisQueueFullError` if there is no free slot.
        """
        # asyncio is cooperative/single-threaded: locked() check and the
        # subsequent acquire() are atomic with respect to other coroutines.
        if self._semaphore.locked():
            raise AnalysisQueueFullError(
                f"Analysis queue is full "
                f"(max_workers={self._max_workers}, max_queue={self._max_queue})"
            )
        async with self._semaphore:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(self._executor, fn, *args)

    def shutdown(self) -> None:
        self._executor.shutdown(wait=False)


def get_pool() -> AnalysisPool:
    """Return the active :class:`AnalysisPool`."""
    if _pool is None:
        raise RuntimeError(
            "Analysis pool is not initialized; call worker.startup() first"
        )
    return _pool


def startup() -> None:
    """Initialize the global pool.  Call once at application startup."""
    global _pool
    max_workers = int(os.getenv("ANALYSIS_MAX_WORKERS", "4"))
    max_queue = int(os.getenv("ANALYSIS_MAX_QUEUE", "10"))
    _pool = AnalysisPool(max_workers=max_workers, max_queue=max_queue)
    logger.info(
        "Analysis pool started max_workers=%d max_queue=%d", max_workers, max_queue
    )


def shutdown() -> None:
    """Shut down the global pool.  Call once at application shutdown."""
    global _pool
    if _pool is not None:
        _pool.shutdown()
        _pool = None
        logger.info("Analysis pool stopped")
