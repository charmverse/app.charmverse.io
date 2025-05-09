/* eslint-disable no-console */

import { provisionSuperApiKey } from 'lib/middleware/requireSuperApiKey';

// use this file and run against production to generate super api keys
// Super API keys allow you to make requests to the API to do things like generate a new space
const name = '';
const token = ''; // set this to create a specific token

(async () => {
  if (!name) {
    throw 'Please provide a name for the key';
  }

  const key = await provisionSuperApiKey(name, token);
  console.log('Super api key provisioned:', key);
})();
