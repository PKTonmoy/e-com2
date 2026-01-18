/**
 * Simple In-Memory Cache for API Performance
 * 
 * This provides a lightweight caching layer to reduce database queries
 * for frequently accessed, rarely changing data (products, settings, etc.)
 * 
 * Features:
 * - TTL (Time To Live) for automatic expiration
 * - Pattern-based cache invalidation
 * - Memory-efficient with automatic cleanup
 */

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default

        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 1000);

        // Don't prevent Node.js from exiting
        this.cleanupInterval.unref();
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlMs - Time to live in milliseconds (optional)
     */
    set(key, value, ttlMs = this.defaultTTL) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now()
        });
    }

    /**
     * Delete a specific key
     * @param {string} key - Cache key to delete
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'products:*')
     */
    invalidatePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
const cache = new SimpleCache();

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
    SHORT: 60 * 1000,           // 1 minute - for frequently changing data
    MEDIUM: 5 * 60 * 1000,      // 5 minutes - for products, categories
    LONG: 30 * 60 * 1000,       // 30 minutes - for settings, static content
    HOUR: 60 * 60 * 1000,       // 1 hour - for rarely changing data
};

/**
 * Express middleware for caching GET requests
 * @param {number} ttlMs - Cache TTL in milliseconds
 * @param {function} keyGenerator - Optional function to generate cache key from request
 */
export const cacheMiddleware = (ttlMs = CACHE_TTL.MEDIUM, keyGenerator = null) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = keyGenerator
            ? keyGenerator(req)
            : `${req.originalUrl}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache the response
        res.json = (data) => {
            cache.set(cacheKey, data, ttlMs);
            res.set('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
};

/**
 * Invalidate cache for a specific resource
 * @param {string} resource - Resource name (e.g., 'products', 'orders')
 */
export const invalidateCache = (resource) => {
    cache.invalidatePattern(`/api/${resource}*`);
    console.log(`[Cache] Invalidated: /api/${resource}*`);
};

export default cache;
