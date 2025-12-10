/**
 * ============================================================================
 * ParallelExecutionLogger
 * ============================================================================
 * Captures parallel test execution logs in a structured way to understand:
 * - Which worker picked which test
 * - Which user was allocated to which worker
 * - Timeline of user lock acquire/release
 * - Session reuse vs fresh login
 * - OTP claims and timing
 * 
 * All logs include [Worker X] prefix for easy filtering
 */

export interface TestExecutionEvent {
  timestamp: number;
  workerIndex: number;
  testName?: string;
  eventType: 'TEST_START' | 'TEST_END' | 'USER_LOCK_ACQUIRE' | 'USER_LOCK_RELEASE' | 'USER_LOCK_WAIT' | 'SESSION_REUSE' | 'FRESH_LOGIN' | 'OTP_CLAIM' | 'OTP_WAIT';
  username?: string;
  profile?: string;
  details?: string;
  status?: 'SUCCESS' | 'FAILED' | 'WAITING' | 'RETRY';
}

class ParallelExecutionLogger {
  private events: TestExecutionEvent[] = [];
  private workerTestMap = new Map<number, { testName: string; startTime: number; profile?: string; user?: string }>();

  /**
   * Log test start
   */
  logTestStart(workerIndex: number, testName: string): void {
    const timestamp = Date.now();
    console.log(
      `[Worker ${workerIndex}] [TEST START] ${testName} at ${new Date(timestamp).toISOString()}`
    );
    this.events.push({
      timestamp,
      workerIndex,
      testName,
      eventType: 'TEST_START',
    });
    this.workerTestMap.set(workerIndex, { testName, startTime: timestamp });
  }

  /**
   * Log test end
   */
  logTestEnd(workerIndex: number, testName: string, status: 'PASSED' | 'FAILED' = 'PASSED'): void {
    const timestamp = Date.now();
    const testStart = this.workerTestMap.get(workerIndex);
    const duration = testStart ? timestamp - testStart.startTime : 0;
    const durationSec = Math.round(duration / 1000);

    console.log(
      `[Worker ${workerIndex}] [TEST END] ${testName} - ${status} (${durationSec}s)`
    );
    this.events.push({
      timestamp,
      workerIndex,
      testName,
      eventType: 'TEST_END',
      status: status === 'PASSED' ? 'SUCCESS' : 'FAILED',
    });
    this.workerTestMap.delete(workerIndex);
  }

  /**
   * Log user allocation and lock acquire
   */
  logUserLockAcquire(
    workerIndex: number,
    username: string,
    profile: string,
    immediate: boolean = true
  ): void {
    const timestamp = Date.now();
    const status = immediate ? 'immediate' : 'after wait';

    console.log(
      `[Worker ${workerIndex}] [USER LOCK] ACQUIRED "${username}" for ${profile} (${status})`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      profile,
      eventType: 'USER_LOCK_ACQUIRE',
      status: 'SUCCESS',
      details: status,
    });

    // Update test mapping with user info
    const test = this.workerTestMap.get(workerIndex);
    if (test) {
      test.user = username;
      test.profile = profile;
    }
  }

  /**
   * Log user lock wait (queued)
   */
  logUserLockWait(workerIndex: number, username: string, profile: string, blockedByWorker: number): void {
    const timestamp = Date.now();

    console.log(
      `[Worker ${workerIndex}] [USER LOCK] WAITING for "${username}" (blocked by Worker ${blockedByWorker})`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      profile,
      eventType: 'USER_LOCK_WAIT',
      status: 'WAITING',
      details: `blocked by Worker ${blockedByWorker}`,
    });
  }

  /**
   * Log user lock release
   */
  logUserLockRelease(workerIndex: number, username: string): void {
    const timestamp = Date.now();

    console.log(`[Worker ${workerIndex}] [USER LOCK] RELEASED "${username}"`);
    this.events.push({
      timestamp,
      workerIndex,
      username,
      eventType: 'USER_LOCK_RELEASE',
      status: 'SUCCESS',
    });
  }

  /**
   * Log session reuse
   */
  logSessionReuse(workerIndex: number, username: string, profile: string): void {
    const timestamp = Date.now();

    console.log(
      `[Worker ${workerIndex}] [SESSION] REUSED for "${username}" (${profile}) - no OTP needed`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      profile,
      eventType: 'SESSION_REUSE',
      status: 'SUCCESS',
    });
  }

  /**
   * Log fresh login (will need OTP)
   */
  logFreshLogin(workerIndex: number, username: string, profile: string): void {
    const timestamp = Date.now();

    console.log(
      `[Worker ${workerIndex}] [SESSION] FRESH LOGIN required for "${username}" (${profile})`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      profile,
      eventType: 'FRESH_LOGIN',
      status: 'SUCCESS',
    });
  }

  /**
   * Log OTP claim
   */
  logOtpClaim(workerIndex: number, username: string, otp: string, waitTimeMs: number = 0): void {
    const timestamp = Date.now();
    const waitSec = Math.round(waitTimeMs / 1000);

    console.log(
      `[Worker ${workerIndex}] [OTP] CLAIMED ${otp.substring(0, 2)}**** for "${username}" ${waitTimeMs > 0 ? `(waited ${waitSec}s)` : '(immediate)'}`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      eventType: 'OTP_CLAIM',
      status: 'SUCCESS',
      details: `OTP: ${otp.substring(0, 2)}****, wait: ${waitSec}s`,
    });
  }

  /**
   * Log OTP wait
   */
  logOtpWait(workerIndex: number, username: string, elapsedMs: number, totalTimeoutMs: number): void {
    const timestamp = Date.now();
    const elapsedSec = Math.round(elapsedMs / 1000);
    const timeoutSec = Math.round(totalTimeoutMs / 1000);

    console.log(
      `[Worker ${workerIndex}] [OTP] WAITING for "${username}" (${elapsedSec}s / ${timeoutSec}s)`
    );
    this.events.push({
      timestamp,
      workerIndex,
      username,
      eventType: 'OTP_WAIT',
      status: 'WAITING',
      details: `${elapsedSec}s / ${timeoutSec}s`,
    });
  }

  /**
   * Generate execution summary
   */
  generateSummary(): string {
    const lines: string[] = [];
    lines.push('\n');
    lines.push('═'.repeat(80));
    lines.push('PARALLEL EXECUTION SUMMARY');
    lines.push('═'.repeat(80));

    // Group events by worker
    const byWorker = new Map<number, TestExecutionEvent[]>();
    for (const event of this.events) {
      if (!byWorker.has(event.workerIndex)) {
        byWorker.set(event.workerIndex, []);
      }
      byWorker.get(event.workerIndex)!.push(event);
    }

    // Print per-worker timeline
    for (let w = 0; w < 3; w++) {
      const workerEvents = byWorker.get(w) || [];
      if (workerEvents.length === 0) continue;

      lines.push(`\nWORKER ${w}:`);
      lines.push('-'.repeat(80));

      for (const event of workerEvents) {
        const time = new Date(event.timestamp).toISOString().substring(11, 19);
        const testStr = event.testName ? ` [${event.testName}]` : '';
        const userStr = event.username ? ` "${event.username}"` : '';
        const profileStr = event.profile ? ` (${event.profile})` : '';

        lines.push(
          `  ${time} | ${event.eventType.padEnd(20)} | ${event.status}${testStr}${userStr}${profileStr}`
        );
      }
    }

    lines.push('\n' + '═'.repeat(80));
    return lines.join('\n');
  }

  /**
   * Export events as JSON for analysis
   */
  exportJson(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

// Global singleton instance
export const parallelLogger = new ParallelExecutionLogger();