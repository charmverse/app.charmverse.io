import { getChainById } from '@packages/blockchain/connectors/chains';

import { getEthersProvider } from '../../../lib/blockchain/getEthersProvider';

import { type EasSchemaChain } from './connectors';
import { getEasInstance } from './getEasInstance';

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
