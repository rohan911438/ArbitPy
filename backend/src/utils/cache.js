import NodeCache from 'node-cache';
import { logger } from './logger.js';

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600, // Default TTL: 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false // Better performance, but be careful with object mutations
    });
    
    this.connected = true;
    
    // Event listeners
    this.cache.on('set', (key, value) => {
      logger.debug(`Cache SET: ${key}`);
    });
    
    this.cache.on('del', (key, value) => {
      logger.debug(`Cache DEL: ${key}`);
    });
    
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
    
    logger.info('Cache manager initialized');
  }
  
  async connect() {
    // For NodeCache, no connection is needed
    // This method exists for consistency with Redis interface
    this.connected = true;
    logger.info('Cache manager connected');
  }
  
  async disconnect() {
    this.cache.close();
    this.connected = false;
    logger.info('Cache manager disconnected');
  }
  
  isConnected() {
    return this.connected;
  }
  
  async get(key) {
    try {
      const value = this.cache.get(key);
      
      if (value !== undefined) {
        logger.debug(`Cache HIT: ${key}`);
        return value;
      } else {
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }
  
  async set(key, value, ttl = null) {
    try {
      const success = this.cache.set(key, value, ttl || this.cache.options.stdTTL);
      
      if (success) {
        logger.debug(`Cache SET success: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
      } else {
        logger.warn(`Cache SET failed: ${key}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }
  
  async del(key) {
    try {
      const count = this.cache.del(key);
      logger.debug(`Cache DEL: ${key} (${count} keys deleted)`);
      return count;
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
      return 0;
    }
  }
  
  async exists(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }
  
  async flush() {
    try {
      this.cache.flushAll();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache FLUSH error:', error);
      return false;
    }
  }
  
  async keys(pattern = '*') {
    try {
      const allKeys = this.cache.keys();
      
      if (pattern === '*') {
        return allKeys;
      }
      
      // Simple pattern matching (convert glob to regex)
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      logger.error(`Cache KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }
  
  async mget(keys) {
    try {
      const result = {};
      
      for (const key of keys) {
        const value = this.cache.get(key);
        if (value !== undefined) {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache MGET error:`, error);
      return {};
    }
  }
  
  async mset(keyValuePairs, ttl = null) {
    try {
      let success = true;
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const result = this.cache.set(key, value, ttl || this.cache.options.stdTTL);
        if (!result) {
          success = false;
          logger.warn(`Cache MSET failed for key: ${key}`);
        }
      }
      
      logger.debug(`Cache MSET: ${Object.keys(keyValuePairs).length} keys`);
      return success;
    } catch (error) {
      logger.error(`Cache MSET error:`, error);
      return false;
    }
  }
  
  async ttl(key) {
    try {
      return this.cache.getTtl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }
  
  async expire(key, ttl) {
    try {
      return this.cache.ttl(key, ttl);
    } catch (error) {
      logger.error(`Cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }
  
  // Utility methods
  getStats() {
    return this.cache.getStats();
  }
  
  // Cache pattern helpers
  
  // Compilation cache helpers
  getCompilationKey(code, options = {}) {
    const hash = Buffer.from(code + JSON.stringify(options)).toString('base64').slice(0, 32);
    return `compilation:${hash}`;
  }
  
  // Deployment cache helpers
  getDeploymentKey(sessionId) {
    return `deployment:${sessionId}`;
  }
  
  // AI response cache helpers
  getAIResponseKey(prompt, model = 'default') {
    const hash = Buffer.from(prompt).toString('base64').slice(0, 32);
    return `ai:${model}:${hash}`;
  }
  
  // User session cache helpers
  getUserSessionKey(userId) {
    return `session:${userId}`;
  }
  
  // Rate limiting cache helpers
  getRateLimitKey(identifier, endpoint) {
    return `ratelimit:${endpoint}:${identifier}`;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export cache keys for consistency
export const CACHE_KEYS = {
  COMPILATION: 'compilation',
  DEPLOYMENT: 'deployment',
  AI_RESPONSE: 'ai',
  USER_SESSION: 'session',
  RATE_LIMIT: 'ratelimit',
  CONTRACT: 'contract',
  ANALYTICS: 'analytics'
};

// Export TTL constants
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};