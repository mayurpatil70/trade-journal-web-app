// frontend/src/utils/routePrefetch.js
import { lazy } from "react";

// In-memory cache of resolved or in-flight module promises
const moduleCache = new Map();

/**
 * Enhanced React.lazy with:
 * 1. Chunk load auto-retry (recovers from network glitches or new production deploys)
 * 2. Ability to prefetch before render on hover or idle
 */
export function safeLazy(importFn, chunkKey = "") {
  const loadModule = () => {
    if (chunkKey && moduleCache.has(chunkKey)) {
      return moduleCache.get(chunkKey);
    }

    const promise = (async () => {
      try {
        const mod = await importFn();
        return mod;
      } catch (error) {
        console.warn(`[SafeLazy] Failed loading chunk "${chunkKey}":`, error);
        const msg = error?.message || "";
        const isChunkError =
          msg.includes("Failed to fetch dynamically imported module") ||
          msg.includes("error loading dynamically imported module") ||
          msg.includes("Importing a module script failed") ||
          error?.name === "ChunkLoadError";

        if (isChunkError && typeof window !== "undefined") {
          const retryKey = "chunk_reload_retry";
          const lastRetry = sessionStorage.getItem(retryKey);
          const now = Date.now();
          if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
            sessionStorage.setItem(retryKey, now.toString());
            window.location.reload();
            return new Promise(() => {}); // Wait for browser reload
          }
        }
        throw error;
      }
    })();

    if (chunkKey) {
      moduleCache.set(chunkKey, promise);
    }
    return promise;
  };

  const LazyComponent = lazy(loadModule);
  LazyComponent.preload = loadModule;
  return LazyComponent;
}

// Registry of route prefetchers
const routePrefetchRegistry = new Map();

export function registerRoutePrefetch(path, prefetchFn) {
  routePrefetchRegistry.set(path.toLowerCase().replace(/\/$/, ""), prefetchFn);
}

export function prefetchRoute(toPath) {
  if (!toPath || typeof toPath !== "string") return;
  const clean = toPath.toLowerCase().split("?")[0].split("#")[0].replace(/\/$/, "");
  
  // Exact match
  if (routePrefetchRegistry.has(clean)) {
    try {
      routePrefetchRegistry.get(clean)();
    } catch (_) {}
    return;
  }

  // Prefix match (e.g., /calculator/lot-size -> /calculator)
  for (const [key, fn] of routePrefetchRegistry.entries()) {
    if (clean.startsWith(key)) {
      try {
        fn();
      } catch (_) {}
      break;
    }
  }
}

/**
 * Idle-time prefetching of heavy secondary chunks (Charts, Backtest, BotHub, etc.)
 * Runs smoothly in the background when the user's browser is idle after dashboard load.
 */
let hasIdlePrefetched = false;
export function prefetchAllSecondaryRoutes() {
  if (hasIdlePrefetched || typeof window === "undefined") return;
  hasIdlePrefetched = true;

  const runPrefetch = () => {
    routePrefetchRegistry.forEach((prefetchFn) => {
      try {
        prefetchFn();
      } catch (_) {}
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runPrefetch, { timeout: 4000 });
  } else {
    setTimeout(runPrefetch, 2500);
  }
}

