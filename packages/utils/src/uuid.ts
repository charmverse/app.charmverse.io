import { createHash } from 'crypto';

import { v4 as uuid } from 'uuid';

// Function to generate a deterministic UUID v4 based on an integer input
export function uuidFromNumber(num: number | string): string {
  // Create a hash of the input number to generate more uniformly distributed random bytes
  const hash = createHash('sha256').update(num.toString()).digest();

  // Convert the first 16 bytes of the hash to a Uint8Array
  const randomBytes = new Uint8Array(hash.buffer, hash.byteOffset, 16);

  // Generate the UUID using the custom random bytes
  return uuid({ random: randomBytes });
}
