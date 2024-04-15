import { log } from '@charmverse/core/log';

import { createOffchainCredentialsForProjects as createGitcoinOffchainCredentialsForProjects } from 'lib/gitcoin/createProjectCredentials';
import { createOffchainCredentialsForProjects as createQuestbookOffchainCredentialsForProjects } from 'lib/questbook/createProjectCredentials';

export async function createOffchainCredentialsForExternalProjects() {
  await createGitcoinOffchainCredentialsForProjects().catch((error) => {
    log.error('Error creating Gitcoin offchain credentials', { error });
  });
  await createQuestbookOffchainCredentialsForProjects().catch((error) => {
    log.error('Error creating Questbook offchain credentials', { error });
  });
}
