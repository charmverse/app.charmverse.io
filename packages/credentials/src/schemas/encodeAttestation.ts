import type { ExternalCredential } from './external';
import { encodeExternalCredential } from './external';
import type { GitcoinProjectCredential } from './gitcoinProjectSchema';
import { encodeGitcoinProjectCredential } from './gitcoinProjectUtils';
import type { AttestationType, CredentialData } from './interfaces';
import type {
  OptimismProjectAttestationData,
  OptimismProjectSnapshotAttestationMetaData
} from './optimismProjectSchemas';
import { encodeOptimismProjectAttestation, encodeOptimismProjectSnapshotAttestation } from './optimismProjectUtils';
import type { ProposalCredential } from './proposal';
import { encodeProposalCredential } from './proposalUtils';
import type { RewardCredential } from './reward';
import { encodeRewardCredential } from './rewardUtils';

export function encodeAttestation<T extends AttestationType = AttestationType>({ type, data }: CredentialData<T>) {
  if (type === 'proposal') {
    return encodeProposalCredential(data as ProposalCredential);
  } else if (type === 'reward') {
    return encodeRewardCredential(data as RewardCredential);
  } else if (type === 'external') {
    return encodeExternalCredential(data as ExternalCredential);
  } else if (type === 'gitcoinProject') {
    return encodeGitcoinProjectCredential(data as GitcoinProjectCredential);
  } else if (type === 'optimismProject') {
    return encodeOptimismProjectAttestation(data as OptimismProjectAttestationData);
  } else if (type === 'optimismProjectSnapshot') {
    return encodeOptimismProjectSnapshotAttestation(data as OptimismProjectSnapshotAttestationMetaData);
  }
  throw new Error(`Invalid Attestation Type: ${type}'`);
}
