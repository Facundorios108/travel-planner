/**
 * Simple in-memory cache for Firebase data
 * Reduces unnecessary Firestore reads and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get data from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl || this.defaultTTL,
    });
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Helper to generate cache keys
export const cacheKeys = {
  userTrips: (userId: string) => `trips:user:${userId}`,
  trip: (tripId: string) => `trip:${tripId}`,
  tripDestinations: (tripId: string) => `destinations:trip:${tripId}`,
  tripActivities: (tripId: string) => `activities:trip:${tripId}`,
  tripExpenses: (tripId: string) => `expenses:trip:${tripId}`,
  tripDocuments: (tripId: string) => `documents:trip:${tripId}`,
};
