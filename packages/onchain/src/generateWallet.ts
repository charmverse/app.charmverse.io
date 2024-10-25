import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

export function generateWallet() {
  const key = generatePrivateKey();

  const account = privateKeyToAccount(key);

  const wallet = { key, account: account.address };

  // Don't use logger so we don't accidentally log private keys to Datadog
  // eslint-disable-next-line no-console
  console.log('Wallet generated: ', wallet);

  return wallet;
}
