import type { Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';

import { getProjectRegistryContract } from 'lib/gitcoin/contracts';
import { fetchFileByHash } from 'lib/ipfs/fetchFileByHash';
import { getInfuraProvider } from 'lib/providers/getInfuraProvider';

type MetadataOnchainDetails = {
  pointer: string;
  protocol: BigNumber;
};

type ProjectOnchainDetails = {
  id: BigNumber;
  metadata: MetadataOnchainDetails;
};

type ProjectMetadata = {
  title: string;
  description: string;
  website: string;
  projectTwitter: string;
  userGithub: string;
  logoImg: string;
  createdAt: number;
};

export type GitcoinProjectDetails = {
  metadata: ProjectMetadata;
  owners: string[];
};

export async function getProjectDetails({
  chainId,
  projectId,
  provider
}: {
  projectId: number;
  chainId: string | number;
  provider: Provider;
}): Promise<GitcoinProjectDetails | null> {
  const projectRegistry = getProjectRegistryContract({ providerOrSigner: provider, chainId });

  const owners: string[] = await projectRegistry.getProjectOwners(projectId);
  const metadataDetails: ProjectOnchainDetails = await projectRegistry.projects(projectId);
  const ipfsHash = metadataDetails.metadata.pointer;

  if (!ipfsHash) {
    return null;
  }

  const metadata = await fetchFileByHash<ProjectMetadata>(ipfsHash);

  return { metadata, owners };
}
