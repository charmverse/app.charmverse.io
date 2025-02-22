import { createHash } from 'crypto';

import { log } from '@charmverse/core/log';
import { v4 as uuid } from 'uuid';

// Function to generate a deterministic UUID v4 based on an integer input
/** @deprecated Use uuidFromNumber from @packages/utils/uuid instead */
export function deterministicV4UUIDFromFid(num: number | string): string {
  // Create a hash of the input number to generate more uniformly distributed random bytes
  const hash = createHash('sha256').update(num.toString()).digest();

  // Convert the first 16 bytes of the hash to a Uint8Array
  const randomBytes = new Uint8Array(hash.buffer, hash.byteOffset, 16);

  // Generate the UUID using the custom random bytes
  return uuid({ random: randomBytes });
}

// Function to generate and check UUIDs for 10,000 integers between 1 and 100,000
function generateUUIDsAndCheckCollisions() {
  const generatedUUIDs = new Set<string>();

  const checked = 10000000;

  for (let i = 1; i <= checked; i++) {
    const generated = deterministicV4UUIDFromFid(i);

    // Check for collisions
    if (generatedUUIDs.has(generated)) {
      log.error(`Collision detected for integer: ${i}`);

      return;
    }

    generatedUUIDs.add(generated);
  }

  log.info(`No collisions detected for ${checked} UUIDs.`);
}
// Test collision resistance
// generateUUIDsAndCheckCollisions();
