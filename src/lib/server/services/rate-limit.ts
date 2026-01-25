interface RateLimit {
  count: number;
  firstAttempt: number;
}

export class RateLimitService {
  private static readonly LOGIN_LIMIT = 5;
  private static readonly REGISTER_LIMIT = 3;
  private static readonly COMMENT_LIMIT = 5;
  private static readonly RESET_PASSWORD_LIMIT = 3;
  private static readonly LIKE_LIMIT = 30;

  private static readonly LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly REGISTER_WINDOW = 60 * 60 * 1000; // 1 hour
  private static readonly COMMENT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private static readonly RESET_PASSWORD_WINDOW = 60 * 60 * 1000; // 1 hour
  private static readonly LIKE_WINDOW = 60 * 1000; // 1 minute

  private static rateLimits = new Map<string, RateLimit>();

  static checkLoginLimit(ip: string): {
    allowed: boolean;
    timeLeft?: number;
  } {
    return this.checkLimit(
      `login:${ip}`,
      this.LOGIN_LIMIT,
      this.LOGIN_WINDOW
    );
  }

  static checkRegisterLimit(ip: string): {
    allowed: boolean;
    timeLeft?: number;
  } {
    return this.checkLimit(
      `register:${ip}`,
      this.REGISTER_LIMIT,
      this.REGISTER_WINDOW
    );
  }

  static checkCommentLimit(userId: number): {
    allowed: boolean;
    timeLeft?: number;
  } {
    return this.checkLimit(
      `comment:${userId}`,
      this.COMMENT_LIMIT,
      this.COMMENT_WINDOW
    );
  }

  static checkPasswordResetLimit(identifier: string): {
    allowed: boolean;
    timeLeft?: number;
  } {
    return this.checkLimit(
      `reset:${identifier}`,
      this.RESET_PASSWORD_LIMIT,
      this.RESET_PASSWORD_WINDOW
    );
  }

  static checkLikeLimit(userId: number): {
    allowed: boolean;
    timeLeft?: number;
  } {
    return this.checkLimit(
      `like:${userId}`,
      this.LIKE_LIMIT,
      this.LIKE_WINDOW
    );
  }

  private static checkLimit(
    key: string,
    maxAttempts: number,
    timeWindow: number
  ): {
    allowed: boolean;
    timeLeft?: number;
  } {
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit) {
      this.rateLimits.set(key, { count: 1, firstAttempt: now });
      return { allowed: true };
    }

    if (now - limit.firstAttempt >= timeWindow) {
      this.rateLimits.set(key, { count: 1, firstAttempt: now });
      return { allowed: true };
    }

    if (limit.count >= maxAttempts) {
      const timeLeft = Math.ceil(
        (timeWindow - (now - limit.firstAttempt)) / 1000
      );
      return { allowed: false, timeLeft };
    }

    limit.count++;
    this.rateLimits.set(key, limit);
    return { allowed: true };
  }

  static cleanup() {
    const now = Date.now();
    const maxWindow = Math.max(
      this.LOGIN_WINDOW,
      this.REGISTER_WINDOW,
      this.COMMENT_WINDOW,
      this.RESET_PASSWORD_WINDOW
    );

    for (const [key, limit] of this.rateLimits.entries()) {
      if (now - limit.firstAttempt >= maxWindow) {
        this.rateLimits.delete(key);
      }
    }
  }
}

setInterval(() => RateLimitService.cleanup(), 60 * 1000);

// Legacy exports for backward compatibility
class InstanceRateLimitService {
  private requestCounts = new Map<string, { count: number; timestamp: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(ip);

    if (!userRequests) {
      this.requestCounts.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (now - userRequests.timestamp > this.windowMs) {
      this.requestCounts.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (userRequests.count >= this.maxRequests) {
      return false;
    }

    userRequests.count++;
    return true;
  }
}

export const commentRateLimit = new InstanceRateLimitService(60 * 1000, 100);
export const authRateLimit = new InstanceRateLimitService(15 * 60 * 1000, 50);
