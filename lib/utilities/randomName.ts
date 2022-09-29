
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
  dictionaries: [
    adjectives,
    [...colors, ...CRYPTO_WORD_LIST],
    animals
  ],
  separator: '-',
  length: 3
};

export default function randomName () {
  return uniqueNamesGenerator(nameGeneratorConfig);
}
