import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
  const url = 'https://api.neynar.com/v2/farcaster/webhook';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      api_key: 'NEYNAR_API_DOCS',
      'content-type': 'application/json'
    }
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => console.log(json))
    .catch((err) => console.error('error:' + err));
}

query();
