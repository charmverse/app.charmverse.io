import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { getSafeOwners } from '@packages/lib/gnosis/safe/getSafeOwners';
import { fetchFileByHash, getIpfsFileUrl } from '@packages/lib/ipfs/fetchFileByHash';
import { getAddress } from 'viem';

import { ProjectRegistryAbi } from './abi/ProjectRegistry';
import { PROJECT_REGISTRY_ADDRESSES } from './constants';
import type { ChainId } from './projectsCount';

type MetadataOnchainDetails = {
  pointer: string;
  protocol: bigint;
};

export type Owners = readonly `0x${string}`[];

type ProjectOnchainDetails = readonly [bigint, MetadataOnchainDetails];

export type ProjectMetadata = {
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
  chainId: number;
  metadata: ProjectMetadata;
  owners: Owners;
  metadataUrl: string;
};

export async function getProjectDetails({
  chainId,
  projectId
}: {
  projectId: number;
  chainId: ChainId;
}): Promise<GitcoinProjectDetails | null> {
  const publicClient = getPublicClient(chainId);

  const onchainOwners = (await publicClient.readContract({
    address: getAddress(PROJECT_REGISTRY_ADDRESSES[chainId]),
    abi: ProjectRegistryAbi,
    functionName: 'getProjectOwners',
    args: [BigInt(projectId)]
  })) as `0x${string}`[];

  const metadataDetails: ProjectOnchainDetails = await publicClient.readContract({
    address: getAddress(PROJECT_REGISTRY_ADDRESSES[chainId]),
    abi: ProjectRegistryAbi,
    functionName: 'projects',
    args: [BigInt(projectId)]
  });

  const ipfsHash = metadataDetails[1]?.pointer;
  const owners = await getProjectOwners(onchainOwners, chainId);

  if (!ipfsHash) {
    return null;
  }

  const metadata = await fetchFileByHash<ProjectMetadata>(ipfsHash);

  return {
    projectId,
    chainId,
    metadata,
    owners: owners.length ? owners : onchainOwners,
    metadataUrl: getIpfsFileUrl(ipfsHash)
  };
}

export async function getProjectOwners(ownerAddresses: Owners, chainId: number) {
  const promises = ownerAddresses.map(async (address) => {
    const owners = await getSafeOwners({ address, chainId });

    if (owners?.length) {
      return owners;
    }
    return [address];
  });

  const results = await Promise.all(promises);

  const owners = [...new Set(results.flat())];

  return owners;
}
