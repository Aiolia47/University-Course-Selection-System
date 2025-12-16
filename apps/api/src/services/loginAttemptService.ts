import { DatabaseService } from './databaseService';

export interface LoginAttemptRecord {
  identifier: string; // username, email, or IP address
  attempts: number;
  lastAttempt: Date;
  lockUntil?: Date;
  isLocked: boolean;
}

export class LoginAttemptService {
  private databaseService: DatabaseService;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_TIME = 30 * 60 * 1000; // 30 minutes
  private readonly TRACK_TIME = 15 * 60 * 1000; // 15 minutes
  private readonly attempts = new Map<string, LoginAttemptRecord>();

  constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  /**
   * Record a failed login attempt
   */
  public recordFailedAttempt(identifier: string): LoginAttemptRecord {
    const now = new Date();
    const existing = this.attempts.get(identifier);

    if (existing) {
      // If existing record is older than tracking time, reset it
      if (now.getTime() - existing.lastAttempt.getTime() > this.TRACK_TIME) {
        existing.attempts = 1;
        existing.lastAttempt = now;
        existing.lockUntil = undefined;
        existing.isLocked = false;
      } else {
        existing.attempts += 1;
        existing.lastAttempt = now;

        // Lock account if max attempts reached
        if (existing.attempts >= this.MAX_ATTEMPTS && !existing.isLocked) {
          existing.lockUntil = new Date(now.getTime() + this.LOCK_TIME);
          existing.isLocked = true;
        }
      }

      this.attempts.set(identifier, existing);
      return existing;
    } else {
      const record: LoginAttemptRecord = {
        identifier,
        attempts: 1,
        lastAttempt: now,
        isLocked: false
      };

      this.attempts.set(identifier, record);
      return record;
    }
  }

  /**
   * Clear successful login attempts
   */
  public clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Check if identifier is locked
   */
  public isLocked(identifier: string): { isLocked: boolean; remainingTime?: number } {
    const record = this.attempts.get(identifier);

    if (!record || !record.isLocked) {
      return { isLocked: false };
    }

    const now = new Date();

    // Check if lock has expired
    if (record.lockUntil && now > record.lockUntil) {
      this.attempts.delete(identifier);
      return { isLocked: false };
    }

    const remainingTime = record.lockUntil ? Math.ceil((record.lockUntil.getTime() - now.getTime()) / 1000) : 0;
    return { isLocked: true, remainingTime };
  }

  /**
   * Get remaining attempts before lockout
   */
  public getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);

    if (!record) {
      return this.MAX_ATTEMPTS;
    }

    const now = new Date();

    // Reset if tracking time has passed
    if (now.getTime() - record.lastAttempt.getTime() > this.TRACK_TIME) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - record.attempts);
  }

  /**
   * Get current attempt information
   */
  public getAttemptInfo(identifier: string): LoginAttemptRecord | null {
    const record = this.attempts.get(identifier);

    if (!record) {
      return null;
    }

    const now = new Date();

    // Reset if tracking time has passed
    if (now.getTime() - record.lastAttempt.getTime() > this.TRACK_TIME) {
      this.attempts.delete(identifier);
      return null;
    }

    // Check if lock has expired
    if (record.lockUntil && now > record.lockUntil) {
      this.attempts.delete(identifier);
      return null;
    }

    return record;
  }

  /**
   * Clean up expired records
   */
  public cleanup(): void {
    const now = new Date();

    for (const [key, record] of this.attempts.entries()) {
      // Remove records older than tracking time and not locked
      if (!record.isLocked && (now.getTime() - record.lastAttempt.getTime() > this.TRACK_TIME)) {
        this.attempts.delete(key);
      }

      // Remove locked records whose lock has expired
      if (record.isLocked && record.lockUntil && now > record.lockUntil) {
        this.attempts.delete(key);
      }
    }
  }

  /**
   * Get all active attempt records (for debugging)
   */
  public getAllAttempts(): Map<string, LoginAttemptRecord> {
    return new Map(this.attempts);
  }
}