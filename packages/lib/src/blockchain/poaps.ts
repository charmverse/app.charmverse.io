import type { UserWallet } from '@charmverse/core/prisma';
import { GET } from '@packages/core/http';
import { log } from '@packages/core/log';

import type { ExtendedPoap } from './interfaces';

type PoapEvent = {
  id: number;
  fancy_id: string;
  name: string;
  event_url: string;
  image_url: string;
  country: string;
  city: string;
  description: string;
  year: number;
  start_date: string;
  end_date: string;
  expiry_date: string;
  supply: number;
};

type PoapInResponse = {
  tokenId: string;
  owner: string;
  created: string;
  chain: string;
  migrated: string;
  event: PoapEvent;
};

const apiKey = process.env.POAP_API_KEY;

export async function getPoapsFromAddress(address: string) {
  if (typeof apiKey !== 'string' || !apiKey) {
    log.debug('No API key for POAPs');
    return [];
  }

  return GET<PoapInResponse[]>(`https://api.poap.tech/actions/scan/${address}`, undefined, {
    headers: { 'X-API-Key': apiKey }
  });
}

export async function getPOAPs(wallets: UserWallet[]): Promise<ExtendedPoap[]> {
  const addresses = wallets.map((w) => w.address);

  const requests = addresses.map(async (address) => {
    return getPoapsFromAddress(address).catch((err) => {
      log.warn(`Error retrieving POAPS for address: ${address}`, err);
      return [];
    });
  });

  const data = await Promise.all(requests);

  const rawPoapInformation = data.flat(1).map((_data, i) => ({ ..._data, walletAddress: addresses[i] }));

  const poaps = rawPoapInformation.map((rawPoap) => ({
    id: `poap_${rawPoap.tokenId}`,
    tokenId: rawPoap.tokenId,
    walletAddress: rawPoap.owner,
    imageURL: rawPoap.event?.image_url,
    created: rawPoap.created,
    name: rawPoap.event?.name,
    isHidden: false,
    walletId: wallets.find((wallet) => wallet.address === rawPoap.walletAddress)?.id ?? null
  }));

  return poaps;
}

export async function getPoapByEventId(eventId: string) {
  if (typeof apiKey !== 'string' || !apiKey) {
    log.debug('No API key for POAPs');
    return null;
  }

  return GET<PoapEvent>(`https://api.poap.tech/events/id/${eventId}`, undefined, {
    headers: { 'X-API-Key': apiKey }
  });
}
