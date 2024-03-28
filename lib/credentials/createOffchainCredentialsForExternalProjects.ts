import { createOffchainCredentialsForProjects } from 'lib/gitcoin/createProjectCredentials';

export async function createOffchainCredentialsForExternalProjects() {
  await createOffchainCredentialsForProjects();
}
