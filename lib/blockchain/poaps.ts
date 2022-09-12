import fetch from 'node-fetch';
import log from 'lib/log';
import { ExtendedPoap } from './interfaces';

const getPOAPsURL = (address: string) => `https://api.poap.tech/actions/scan/${address}`;

export async function getPOAPs (addresses: string[]): Promise<ExtendedPoap[]> {
  const requests: Array<Promise<any>> = [];

  const apiKey = process.env.POAP_API_KEY;
  if (typeof apiKey !== 'string') {
    log.debug('No API key for POAPs');
    return [];
  }

  addresses.forEach(address => {
    const request = fetch(getPOAPsURL(address), {
      headers: { 'X-API-Key': apiKey }
    });
    requests.push(request);
  });

  const response = await Promise.all(requests);
  const data = await Promise.all(response.map(r => r.json()));

  const rawPoapInformation = data.flat(1);
  const poaps = rawPoapInformation.map(rawPoap => ({
    id: `poap_${rawPoap.tokenId}`,
    tokenId: rawPoap.tokenId,
    walletAddress: rawPoap.owner,
    imageURL: rawPoap.event?.image_url,
    created: rawPoap.created,
    name: rawPoap.event?.name,
    isHidden: false
  }));

  return poaps;
}

