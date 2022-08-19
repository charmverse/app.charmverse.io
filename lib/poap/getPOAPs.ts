import fetch from 'node-fetch';
import { ExtendedPoap } from 'models';

const getPOAPsURL = (address: string) => `https://api.poap.tech/actions/scan/${address}`;

export default async function getPOAPs (addresses: Array<string>): Promise<Array<Partial<ExtendedPoap>>> {
  const requests: Array<Promise<any>> = [];

  addresses.forEach(address => {
    const request = fetch(getPOAPsURL(address), {
      headers: { 'X-API-Key': <string>process.env.POAP_API_KEY }
    });
    requests.push(request);
  });

  const response = await Promise.all(requests);
  const data = await Promise.all(response.map(r => r.json()));

  const rawPoapInformation = data.flat(1);
  const poaps = rawPoapInformation.map(rawPoap => ({
    tokenId: rawPoap.tokenId,
    walletAddress: rawPoap.owner,
    imageURL: rawPoap.event?.image_url,
    created: rawPoap.created,
    name: rawPoap.event?.name
  }));

  return poaps;
}

