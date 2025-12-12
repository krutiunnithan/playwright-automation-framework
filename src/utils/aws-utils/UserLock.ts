/**
 * ============================================================================
 * UserLock Manager
 * ============================================================================
 * Prevents concurrent usage of the same user across DIFFERENT workers.
 * 
 * ALLOWS: Same worker using same user multiple times (session reuse)
 * BLOCKS: Different worker using same user simultaneously
 * 
 * Lock is released when test completes (fail or pass), not on logout.
 */

interface UserLock {
  username: string;
  lockedByWorker: number;
  lockedAt: number;
}

interface QueueItem {
  workerIndex: number;
  profile: string;
  resolve: () => void;
}

interface UserQueue {
  username: string;
  queue: QueueItem[];
}

// In-memory tracking
const userLocks = new Map<string, UserLock>();
const userQueues = new Map<string, UserQueue>();
const workerCurrentUsers = new Map<number, string>(); // Track which user each worker has locked
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max lock age


import { parallelLogger } from '@utils/log-utils/ParallelExecutionLogger';


/**
 * ============================================================================
 * acquireUserLock
 * ============================================================================
 * Acquire lock for a user. Blocks if DIFFERENT worker has it, allows same worker.
 * 
 * CALL in: LoginPage.login()
 * RELEASE in: pom-fixtures.test.afterEach()
 */
export async function acquireUserLock(
  username: string,
  workerIndex: number,
  profile: string,
  testName?: string,
  timeoutMs: number = 30000
): Promise<string> {
  const startTime = Date.now();
  const lockId = `${workerIndex}-${username}-${Date.now()}`;

  return new Promise((resolveAcquire, rejectAcquire) => {
    const tryAcquire = () => {
      const currentLock = userLocks.get(username);

      // CASE 1: User is free → acquire lock immediately
      if (!currentLock) {
        userLocks.set(username, {
          username,
          lockedByWorker: workerIndex,
          lockedAt: Date.now(),
        });

        workerCurrentUsers.set(workerIndex, username);

        parallelLogger.logUserLockAcquire(workerIndex, username, profile, true);
        resolveAcquire(lockId);
        return;
      }

      // CASE 2: SAME WORKER already has it → allow reuse without waiting
      if (currentLock.lockedByWorker === workerIndex) {
        parallelLogger.logUserLockAcquire(workerIndex, username, profile, true);
        resolveAcquire(lockId);
        return;
      }

      //  CASE 3: DIFFERENT WORKER has it → queue and wait
      const elapsedMs = Date.now() - startTime;

      if (elapsedMs > timeoutMs) {
        rejectAcquire(
          new Error(
            `[UserLock] Timeout waiting for lock on "${username}" (locked by Worker ${currentLock.lockedByWorker}, waited ${elapsedMs}ms)`
          )
        );
        return;
      }

      // Check if lock is stale
      const lockAgeMs = Date.now() - currentLock.lockedAt;
      if (lockAgeMs > LOCK_TIMEOUT_MS) {
        console.warn(
          `[UserLock] STALE LOCK detected for "${username}" (age: ${lockAgeMs}ms), force-releasing`
        );
        userLocks.delete(username);
        workerCurrentUsers.delete(currentLock.lockedByWorker);
        tryAcquire();
        return;
      }

      // Queue this worker to wait
      if (!userQueues.has(username)) {
        userQueues.set(username, { username, queue: [] });
      }

      const queue = userQueues.get(username)!;
      const isAlreadyQueued = queue.queue.some((q) => q.workerIndex === workerIndex);

      if (!isAlreadyQueued) {
        parallelLogger.logUserLockWait(workerIndex, username, profile, currentLock.lockedByWorker);
        queue.queue.push({
          workerIndex,
          profile,
          resolve: () => {
            parallelLogger.logUserLockAcquire(workerIndex, username, profile, false);
            tryAcquire();
          },
        });
      }

      setTimeout(tryAcquire, 500);
    };

    tryAcquire();
  });
}

/**
 * ============================================================================
 * releaseUserLockByWorker
 * ============================================================================
 * Release lock for a worker (called in afterEach for ALL tests, pass or fail)
 * 
 * CALL in: pom-fixtures.test.afterEach()
 */
export function releaseUserLockByWorker(workerIndex: number): void {
  const username = workerCurrentUsers.get(workerIndex);

  if (!username) {
    return; // Worker has no lock
  }

  const lock = userLocks.get(username);

  if (lock && lock.lockedByWorker === workerIndex) {
    userLocks.delete(username);
    workerCurrentUsers.delete(workerIndex);

    // Process next worker in queue
    const queue = userQueues.get(username);
    if (queue && queue.queue.length > 0) {
      const next = queue.queue.shift();
      if (next) {
        next.resolve();
      }
    }
  }
}

/**
 * ============================================================================
 * clearAllLocks
 * ============================================================================
 * Force clear all locks (for testing/cleanup)
 */
export function clearAllLocks(): void {
  userLocks.clear();
  userQueues.clear();
  workerCurrentUsers.clear();
}