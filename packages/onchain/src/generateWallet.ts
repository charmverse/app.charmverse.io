import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

function generateWallet() {
  const key = generatePrivateKey();

  const account = privateKeyToAccount(key);

  const wallet = { key, account };

  // Don't use logger so we don't accidentally log private keys
  // eslint-disable-next-line no-console
  console.log('Wallet generated: ', wallet);

  return wallet;
}
