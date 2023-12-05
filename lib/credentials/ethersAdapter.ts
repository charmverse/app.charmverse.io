// Solution for adapter

import { Wallet } from 'ethers';

// https://github.com/ethers-io/ethers.js/issues/4279#issuecomment-1665738644
export class EthersV5toV6WalletAdapter extends Wallet {
  signTypedData: typeof Wallet.prototype._signTypedData;

  getNonce: typeof Wallet.prototype.getTransactionCount;

  populateCall: typeof Wallet.prototype.populateTransaction;

  constructor(params: ConstructorParameters<typeof Wallet>) {
    super(...params);
    this.signTypedData = this._signTypedData;
    this.getNonce = this.getTransactionCount;
    this.populateCall = this.populateTransaction;
  }
}
