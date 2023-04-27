import type { Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';

import { getProjectRegistryContract } from 'lib/gitcoin/getProjectRegistryContract';
import { fetchFileByHash, getIpfsFileUrl } from 'lib/ipfs/fetchFileByHash';
import log from 'lib/log';
import { getSafeOwners } from 'lib/safe/getSafeOwners';

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
  bannerImg: string;
  createdAt: number;
};

export type GitcoinProjectDetails = {
  projectId: number;
  metadata: ProjectMetadata;
  owners: string[];
  metadataUrl: string;
};

export async function getProjectDetails({
  chainId,
  projectId,
  provider
}: {
  projectId: number;
  chainId: number;
  provider: Provider;
}): Promise<GitcoinProjectDetails | null> {
  const projectRegistry = getProjectRegistryContract({ providerOrSigner: provider, chainId });

  const onchainOwners: string[] = await projectRegistry.getProjectOwners(projectId);
  const metadataDetails: ProjectOnchainDetails = await projectRegistry.projects(projectId);
  const ipfsHash = metadataDetails.metadata.pointer;
  const owners = await getProjectOwners(onchainOwners, provider);

  if (!ipfsHash) {
    return null;
  }

  const metadata = await fetchFileByHash<ProjectMetadata>(ipfsHash);

  return {
    projectId,
    metadata,
    owners: owners.length ? owners : onchainOwners,
    metadataUrl: getIpfsFileUrl(ipfsHash)
  };
}

async function getProjectOwners(ownerAddresses: string[], provider: Provider) {
  const promises = ownerAddresses.map((address) => getSafeOwners({ address, provider }));
  const results = await Promise.all(promises);

  const owners = results.reduce<string[]>((acc, o) => {
    if (o?.length) {
      return [...acc, ...o];
    }

    return acc;
  }, []);

  log.info('🔥 safe owners:', owners);

  return owners;
}
