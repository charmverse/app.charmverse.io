/* eslint-disable no-console */

import { provisionSuperApiKey } from 'lib/middleware/requireSuperApiKey';

// use this file and run against production to generate super api keys
const name = '';

(async () => {
    if (!name) {
      throw 'Please provide a name for the key';
    }

    const key = await provisionSuperApiKey(name);
    console.log('Super api key provisioned:', key);

})();
