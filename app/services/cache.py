import threading
import time
from typing import Generic, TypeVar

T = TypeVar("T")


class InMemoryTTLCache(Generic[T]):
    """Thread-safe in-memory cache with item TTL expiration."""

    def __init__(self):
        self._cache: dict[str, tuple[T, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> T | None:
        with self._lock:
            item = self._cache.get(key)
            if item is None:
                return None
            val, expires_at = item
            if time.time() > expires_at:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: T, ttl_seconds: int = 3600) -> None:
        with self._lock:
            expires_at = time.time() + ttl_seconds
            self._cache[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def __len__(self) -> int:
        with self._lock:
            now = time.time()
            # Prune expired on read
            expired = [k for k, (_, exp) in self._cache.items() if now > exp]
            for k in expired:
                del self._cache[k]
            return len(self._cache)
