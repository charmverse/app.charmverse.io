import { log } from '@charmverse/core/log';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { Wallet, providers } from 'ethers';
import type { Address } from 'viem';

import { scoutGameAttestationChainId, scoutGameEasAttestationContractAddress } from './constants';

export type ScoutGameAttestationInput = {
  schemaId: string;
  recipient?: Address;
  refUID?: `0x${string}`;
  data: `0x${string}`;
};

async function setupEAS() {
  const attesterWalletKey = process.env.SCOUTPROTOCOL_EAS_ATTESTER_PRIVKEY;

  const rpcUrl = getChainById(scoutGameAttestationChainId)?.rpcUrls[0] as string;

  const provider = new providers.JsonRpcProvider({
    url: rpcUrl as string,
    skipFetchSetup: true
  });

  const wallet = new Wallet(attesterWalletKey as string, provider);

  const eas = new EAS(scoutGameEasAttestationContractAddress);

  eas.connect(wallet);

  const currentGasPrice = await wallet.getGasPrice();

  return {
    eas,
    currentGasPrice
  };
}

export async function attestOnchain({ data, schemaId, refUID, recipient }: ScoutGameAttestationInput): Promise<string> {
  const { eas, currentGasPrice } = await setupEAS();

  const attestationUid = await eas
    .attest(
      {
        schema: schemaId,
        data: {
          recipient: recipient ?? NULL_EVM_ADDRESS,
          data,
          refUID,
          revocable: true
        }
      },
      { gasPrice: currentGasPrice }
    )
    .then((tx) => tx.wait());

  log.info(
    `Issued attestation for schema ${schemaId} on chain ${scoutGameAttestationChainId} with uid: ${attestationUid}`,
    {
      chainId: scoutGameAttestationChainId,
      schemaId
    }
  );

  return attestationUid;
}

export async function multiAttestOnchain({
  records,
  schemaId
}: {
  schemaId: string;
  records: Omit<ScoutGameAttestationInput, 'schemaId'>[];
}): Promise<string[]> {
  const { eas, currentGasPrice } = await setupEAS();

  const attestationUids = await eas
    .multiAttest(
      [
        {
          schema: schemaId,
          data: records.map((r) => ({
            recipient: r.recipient ?? NULL_EVM_ADDRESS,
            data: r.data,
            refUID: r.refUID,
            revocable: true
          }))
        }
      ],
      { gasPrice: currentGasPrice }
    )

    .then((tx) => tx.wait());

  log.info(
    `Issued ${attestationUids.length} attestations for schema ${schemaId} on chain ${scoutGameAttestationChainId} with uids: ${attestationUids.join(', ')}`,
    {
      chainId: scoutGameAttestationChainId,
      schemaId
    }
  );

  return attestationUids;
}
