import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';

import { githubGrapghQLClient } from 'lib/github/githubGraphQLClient';

type GithubUser = {
  login: string;
  name?: string;
  email?: string;
  twitter?: string;
  location?: string;
  isHireable?: boolean;
};

export async function getGithubUsers({ logins }: { logins: string[] }): Promise<GithubUser[]> {
  const total = logins.length;

  const perQuery = 100;

  const maxQueriedRepos = total;

  log.info(`Total users to query: ${total}`);

  const allData: GithubUser[] = [];

  for (let i = 0; i <= maxQueriedRepos; i += perQuery) {
    const list = logins.slice(i, i + perQuery);

    if (list.length === 0) {
      break;
    }
    const results = await githubGrapghQLClient
      .query<{ data: any }>({
        query: gql`
          query {
            ${list
              .map(
                (login, index) => `user${index}: user(login: "${login}") {
              ...UserFragment
            }`
              )
              .join('\n')}
          }

          fragment UserFragment on User {
            login
            location
            twitterUsername
            email
            isHireable
            name
          }
        `
      })
      .then(({ data }) => {
        return Object.values(data).map((edge) => ({
          login: edge.login,
          name: edge.name || undefined,
          email: edge.email || undefined,
          twitter: edge.twitterUsername || undefined,
          location: edge.location || undefined,
          isHireable: edge.isHireable
        }));
      })
      .catch((error) => {
        log.error('Could not resolve users', { logins, error });
        return [];
      });

    allData.push(...results);

    log.info(`Queried users ${i + 1}-${i + Math.min(list.length, perQuery)} / ${maxQueriedRepos}`);
  }
  return allData;
}
