import { log } from '@charmverse/core/log';
import { RateLimit } from 'async-sema';

// at most, 50 req per second
// Moxy's rate limit is 3000/min and burst of 300/second.
// @source https://docs.airstack.xyz/airstack-docs-and-faqs/api-capabilities#rate-limits
const rateLimiter = RateLimit(50);

export async function airstackRequest(query: string) {
  await rateLimiter();
  const response = await fetch('https://api.airstack.xyz/gql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.AIRSTACK_API_KEY as string
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    log.debug('Error fetching Moxie NFT data:', { query, response });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
