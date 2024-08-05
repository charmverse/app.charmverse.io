import { log } from '@charmverse/core/log';
import { createOffchainCredentialsForProjects as createGitcoinOffchainCredentialsForProjects } from '@root/lib/gitcoin/createProjectCredentials';
import { createOffchainCredentialsForProjects as createQuestbookOffchainCredentialsForProjects } from '@root/lib/questbook/createProjectCredentials';

export async function createOffchainCredentialsForExternalProjects() {
  await createGitcoinOffchainCredentialsForProjects().catch((error) => {
    log.error('Error creating Gitcoin offchain credentials', { error });
  });
  await createQuestbookOffchainCredentialsForProjects().catch((error) => {
    log.error('Error creating Questbook offchain credentials', { error });
  });
}
