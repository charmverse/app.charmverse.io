import { DataNotFoundError } from '@charmverse/core/errors';
import { isTruthy } from '@root/lib/utils/types';
import { getAddress } from 'viem';

import { createGraphqlClient } from './graphql/client';
import type { ChainId } from './graphql/endpoints';
import { endpoints } from './graphql/endpoints';
import { getGrantApplicationsQuery } from './graphql/queries';

type Application = {
  id: string;
  applicantId: string;
  state: string;
  updatedAtS: string;
  grant: {
    id: string;
    title: string;
  };
  actions: {
    id: string;
    state: string;
    updatedAtS: string;
  }[];
  fields: {
    id: string;
    values: {
      id: string;
      value: string;
    }[];
  }[];
};

export async function getGrantApplications(chainId: ChainId, startDate?: number) {
  const chainEndpoint = endpoints[chainId];

  if (!chainEndpoint) {
    throw new DataNotFoundError(`Chain ${chainId} is not supported`);
  }
  const client = createGraphqlClient(endpoints[chainId]);

  const { data } = await client.query<{ grantApplications: Application[] }>({
    query: getGrantApplicationsQuery,
    variables: {
      startDate
    }
  });
  return data?.grantApplications;
}

export async function getGrantApplicationsWithMeta(chainId: ChainId) {
  const yesterday = yesterdayUnixTimestamp();
  const startDate = Math.round(yesterday);
  const applications = await getGrantApplications(chainId, startDate);

  return mapApplications(applications, chainId);
}

function mapApplications(aplications: Application[], chainId: ChainId) {
  const mappedApplications = aplications.map((app) => {
    // 1. Get all the required fields
    const applicantAddressField = getField(app.fields, 'applicantAddress');
    const applicationApplicantNameField = getField(app.fields, 'applicantName');
    const projectNameField = getField(app.fields, 'projectName');
    const twitterField = getField(app.fields, 'Twitter');

    // 2. Get all the required values
    const recipient = getValueFromField(applicantAddressField);
    const applicantName = getValueFromField(applicationApplicantNameField);
    const projectName = getValueFromField(projectNameField);
    const twitter = getValueFromField(twitterField);

    const proposalUrl = `https://www.questbook.app/dashboard/?proposalId=${app.id}&grantId=${app.grant.id}&role=community&isRenderingProposalBody=true&chainId=${chainId}`;
    const date = app.actions.find((action) => action.state === 'approved')?.updatedAtS;

    if (!recipient || !projectName) {
      return null;
    }

    try {
      const recipientAddress = getAddress(recipient);

      return {
        id: app.id,
        applicantId: app.applicantId,
        state: app.state,
        grantTitle: app.grant.title,
        grantId: app.grant.id,
        date,
        twitter,
        projectName,
        recipient: recipientAddress,
        applicantName,
        proposalUrl
      };
    } catch (_err) {
      return null;
    }
  });

  return mappedApplications.filter(isTruthy);
}

function getField(fields: Application['fields'], name: string) {
  return fields.find((field) => field.id.includes(name));
}

function getValueFromField(field?: Application['fields'][0]) {
  return field?.values?.[0]?.value;
}

function yesterdayUnixTimestamp() {
  const yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;
  return Math.round(yesterday / 1000);
}

getGrantApplicationsWithMeta(10);
