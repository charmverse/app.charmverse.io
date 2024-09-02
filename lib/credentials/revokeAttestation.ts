import { log } from '@charmverse/core/log';
import { credentialsWalletPrivateKey } from '@root/config/constants';
import { getChainById } from '@root/connectors/chains';
import { Wallet } from 'ethers';

import { getCurrentGasPrice } from '../blockchain/getCurrentGasPrice';
import { getEthersProvider } from '../blockchain/getEthersProvider';

import type { EasSchemaChain } from './connectors';
import { getEasInstance } from './getEasInstance';

export async function revokeAttestation({
  attestationUID,
  chainId
}: {
  attestationUID: string;
  chainId: EasSchemaChain;
}): Promise<void> {
  const rpcUrl = getChainById(chainId)?.rpcUrls[0] as string;

  const provider = getEthersProvider({ rpcUrl });

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  const currentGasPrice = await getCurrentGasPrice({ chainId });

  eas.connect(wallet);

  const isRevoked = await eas.isAttestationRevoked(attestationUID);

  if (isRevoked) {
    log.info(`Attestation ${attestationUID} is already revoked on chain ${chainId}`);
    return;
  }

  const attestation = await eas.getAttestation(attestationUID);

  await eas
    .revoke(
      {
        data: {
          uid: attestationUID,
          value: 0
        },
        schema: attestation.schema
      },
      { gasPrice: currentGasPrice }
    )
    .then(async (tx) => {
      await tx.wait();
      log.info(`Attestation ${attestationUID} revoked on chain ${chainId}`);
    })
    .catch((error) => {
      log.error(`Failed to revoke attestation ${attestationUID} on chain ${chainId}`, {
        error,
        attestationUID,
        chainId
      });
      throw error;
    });
}
