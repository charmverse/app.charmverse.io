import { fetchFileByHash } from 'lib/ipfs/fetchFileByHash';

import type { ProjectMetadata } from './getProjectDetails';
import { createGraphqlClient } from './graphql/client';
import { endpoints } from './graphql/endpoints';
import { getRoundApplicationsQuery } from './graphql/queries';

type ChainId = keyof typeof endpoints;

type Application = {
  id: string;
  status: number;
  statusDescription: string;
  applicationIndex: number;
  round: {
    id: string;
    roundMetaPtr: {
      pointer: string;
    };
  };
  metaPtr: {
    pointer: string;
  };
};

type ApplicationMetadata = {
  signature: string;
  application: {
    round: string;
    recipient: string;
    project: ProjectMetadata;
    answers: { questionId: number; question: string; type: string; hidden: boolean; answer: string }[];
  };
};

type RoundMetadata = {
  name: string;
};

type ApplicationWithMetadata = Application & {
  metadata: { application: ApplicationMetadata['application']; round: RoundMetadata };
};

export async function getRoundApplications(chainId: ChainId) {
  const client = createGraphqlClient(endpoints[chainId]);

  const { data } = await client.query<{ roundApplications: Application[] }>({
    query: getRoundApplicationsQuery
    // @TODO find a way to get more then 1000 rounds
  });
  return data?.roundApplications;
}

export async function getRoundApplicationsWithMeta(chainId: ChainId) {
  const applications = await getRoundApplications(chainId);
  const updatedApplications: ApplicationWithMetadata[] = [];

  for (const application of applications) {
    const ipfsApplicationPointer = application.metaPtr.pointer;
    const ipfsRoundMetadata = application.round.roundMetaPtr.pointer;
    const applicationMetadata = await fetchFileByHash<ApplicationMetadata>(ipfsApplicationPointer).catch(() => null);
    const roundMetadata = await fetchFileByHash<RoundMetadata>(ipfsRoundMetadata).catch(() => null);

    if (applicationMetadata && roundMetadata) {
      updatedApplications.push({
        ...application,
        metadata: {
          application: applicationMetadata.application,
          round: roundMetadata
        }
      });
    }
  }

  return updatedApplications;
}
