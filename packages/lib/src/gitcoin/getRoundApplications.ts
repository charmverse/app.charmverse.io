import { fetchFileByHash } from '@packages/lib/ipfs/fetchFileByHash';

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
    applicationsEndTime: string;
    roundMetaPtr: {
      pointer: string;
    };
  };
  statusSnapshots: {
    status: number;
    timestamp: string;
  }[];
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
  metadata: ProjectMetadata & { roundName: string; recipient: string };
};

export async function getRoundApplications(chainId: ChainId, startDate?: number) {
  const client = createGraphqlClient(endpoints[chainId]);

  const { data } = await client.query<{ roundApplications: Application[] }>({
    query: getRoundApplicationsQuery,
    variables: {
      startDate
    }
  });
  return data?.roundApplications;
}

export async function getRoundApplicationsWithMeta(chainId: ChainId) {
  const startDate = yesterdayUnixTimestamp();
  const applications = await getRoundApplications(chainId, startDate);
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
          roundName: roundMetadata.name,
          recipient: applicationMetadata.application.recipient,
          ...applicationMetadata.application.project
        }
      });
    }
  }

  return updatedApplications;
}

function yesterdayUnixTimestamp() {
  const yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;
  return Math.round(yesterday / 1000);
}
