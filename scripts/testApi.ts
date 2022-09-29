/* eslint-disable no-console */

export {};

// use this file and test api keys

const apiDomain = 'https://app.charmverse.io';
const apiKey = process.env.API_KEY;

(async () => {

  try {
    const response = await fetch(`${apiDomain}/api/v1/bounties`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }).then(r => r.json());
    console.log(response);
    process.exit();
  }
  catch (err) {
    console.error('Error', err);
    process.exit(1);
  }

})();
