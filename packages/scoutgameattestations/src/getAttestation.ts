import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/chains';
import { providers } from 'ethers';

import { scoutGameAttestationChainId, scoutGameEasAttestationContractAddress } from './constants';

export function getAttestion({ attestationUid }: { attestationUid: string }) {
  const rpcUrl = getChainById(scoutGameAttestationChainId)?.rpcUrls[0] as string;

  const provider = new providers.JsonRpcProvider({
    url: rpcUrl as string,
    skipFetchSetup: true
  });

  const eas = new EAS(scoutGameEasAttestationContractAddress);

  eas.connect(provider);

  return eas.getAttestation(attestationUid);
}
