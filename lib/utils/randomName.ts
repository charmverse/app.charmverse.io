import { capitalize } from '@packages/utils/strings';
import type { Config } from 'unique-names-generator';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

const CRYPTO_WORD_LIST = [
  'airdrop',
  'alpha',
  'apein',
  'bearish',
  'blockchain',
  'bluechip',
  'bullish',
  'coinbase',
  'cryptowallet',
  'cryptowalletaddress',
  'decentralized',
  'dao',
  'dapp',
  'defi',
  'diamondhands',
  'doxxed',
  'drop',
  'dyor',
  'doteth',
  'ethereum',
  'flip',
  'floor',
  'floorprice',
  'floorsweep',
  'fomo',
  'fud',
  'gasfee',
  'gm',
  'hodl',
  'lfg',
  'marketplace',
  'metamask',
  'metaverse',
  'minting',
  'mooning',
  'ngmi',
  'opensea',
  'paperhands',
  'pfp',
  'polygon',
  'pumpanddump',
  'p2e',
  'roadmap',
  'rugpull',
  'sharding',
  'solana',
  'smartcontract',
  'staking',
  'tothemoon',
  'utility'
];

const nameGeneratorConfig: Config = {
  dictionaries: [adjectives, [...colors, ...CRYPTO_WORD_LIST], animals],
  separator: '-',
  length: 3
};

export function randomName() {
  return uniqueNamesGenerator(nameGeneratorConfig);
}

export function deterministicRandomName(input: string) {
  const colour = uniqueNamesGenerator({
    dictionaries: [colors],
    separator: '',
    length: 1,
    seed: input
  });

  const animal = uniqueNamesGenerator({
    dictionaries: [animals],
    separator: '',
    length: 1,
    seed: input
  });

  const name = `${capitalize(colour)} ${capitalize(animal)}`;

  return name;
}
