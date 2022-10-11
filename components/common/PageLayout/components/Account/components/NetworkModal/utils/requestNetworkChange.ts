import { BigNumber } from '@ethersproject/bignumber';
import type { ExternalProvider } from '@ethersproject/providers';
import type { Blockchain } from 'connectors';
import { RPC } from 'connectors';

import log from 'lib/log';

type WindowType = Window & typeof globalThis & { ethereum: ExternalProvider }

const requestNetworkChange = (targetNetwork: Blockchain, callback?: () => void) => async () => {
  // @ts-ignore Not using .toHexString(), because the method requires unpadded format: '0x1' for mainnet, not '0x01'
  const chainId = `0x${(+BigNumber.from(RPC[targetNetwork].chainId)).toString(16)}`;

  const { ethereum } = window as WindowType;

  try {
    await ethereum.request?.({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
    callback?.();
  }
  catch (e) {
    // This error code indicates that the chain has not been added to MetaMask.
    if ((<any> e).code === 4902) {
      try {
        if (!RPC[targetNetwork]) throw Error();

        await ethereum.request?.({
          method: 'wallet_addEthereumChain',
          params: [RPC[targetNetwork]]
        });
      }
      catch (addError) {
        log.warn('Failed to add network to MetaMask');
      }
    }
    // handle other "switch" errors
  }
};

export default requestNetworkChange;
