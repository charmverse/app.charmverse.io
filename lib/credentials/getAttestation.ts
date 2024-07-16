import { JsonRpcProvider } from '@ethersproject/providers';
import { getChainById } from '@root/connectors/chains';
import { optimism } from 'viem/chains';

import { getEthersProvider } from '../blockchain/getEthersProvider';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { decodeOptimismProjectSnapshotAttestation } from './schemas/optimismProjectSchemas';

export async function getAttestation({ attestationUID, chainId }: { chainId: EasSchemaChain; attestationUID: string }) {
  const eas = getEasInstance(chainId);
  const chain = getChainById(chainId);
  const provider = getEthersProvider({ rpcUrl: chain!.rpcUrls[0] });

  await provider.ready;

  eas.connect(provider);

  // Fetch attestation
  const attestation = await eas.getAttestation(attestationUID);

  return attestation;
}
