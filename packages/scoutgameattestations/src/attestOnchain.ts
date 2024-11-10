import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { Wallet, providers } from 'ethers';
import type { Address } from 'viem';

import { scoutGameAttestationChainId, scoutGameEasAttestationContractAddress } from './constants';
import { attestationLogger } from './logger';

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

  attestationLogger.info(
    `Issued attestation for schema ${schemaId} on chain ${scoutGameAttestationChainId} with uid: ${attestationUid}`,
    {
      chainId: scoutGameAttestationChainId,
      schemaId
    }
  );

  return attestationUid;
}

const maxPerBatch = 30;

export async function multiAttestOnchain(params: {
  schemaId: string;
  records: Omit<ScoutGameAttestationInput, 'schemaId'>[];
  onAttestSuccess?: (input: { attestationUid: string; data: `0x${string}`; index: number }) => Promise<void>;
  batchStartIndex?: number;
}): Promise<`0x${string}`[]> {
  if (params.records.length === 0) {
    return [];
  }

  if (params.records.length > maxPerBatch) {
    const allUids: `0x${string}`[] = [];
    for (let i = 0; i < params.records.length; i += maxPerBatch) {
      const uids = await multiAttestOnchain({
        schemaId: params.schemaId,
        records: params.records.slice(i, i + maxPerBatch),
        onAttestSuccess: params.onAttestSuccess,
        batchStartIndex: i
      });
      allUids.push(...uids);
    }

    return allUids;
  }

  const { schemaId, records, onAttestSuccess, batchStartIndex = 0 } = params;

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

  if (onAttestSuccess) {
    for (let i = 0; i < attestationUids.length; i++) {
      await onAttestSuccess({ attestationUid: attestationUids[i], data: records[i].data, index: batchStartIndex + i });
    }
  }

  attestationLogger.info(
    `Issued ${attestationUids.length} attestations for schema ${schemaId} on chain ${scoutGameAttestationChainId} with uids: ${attestationUids.join(', ')}`,
    {
      chainId: scoutGameAttestationChainId,
      schemaId
    }
  );

  return attestationUids as `0x${string}`[];
}
