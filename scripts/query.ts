import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { uniqBy, uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */
import { readEcosystems } from './github/query';
import { getGithubUsers } from './github/getGithubUsers';

const bots = [
  'github-actions',
  'release-please-for-lemonade',
  'mend-bolt-for-github',
  'dependabot[bot]',
  'nero-alpha',
  'app-token-issuer-functions',
  'allcontributors',
  'novasama-bot',
  'nips-ja-sync',
  'layerone-renovate',
  'depfu',
  'duwenjieG',
  'hercules-ci',
  'core-repository-dispatch-app',
  'pr-action',
  'moonpay-github-security',
  'renovate',
  'app-token-issuer-infra-releng',
  'app-token-issuer-releng-renovate',
  'ellipsis-dev',
  'term-finance-publisher',
  'transifex-integration',
  'aaronyuai',
  'api3-ecosystem-pr-bot',
  'sweep-ai',
  'stack-file',
  'devin-ai-integration',
  'cybersecurity-github-actions-ci',
  'pre-commit-ci',
  'runway-github',
  'akeyless-target-app',
  'finschia-auto-pr',
  'bitgo-renovate-bot',
  'sui-merge-bot',
  'stainless-app',
  'ipfs-shipyard-mgmt-read-write',
  'azure-pipelines',
  'penify-dev',
  'term-finance-publisher',
  'live-github-bot',
  'paritytech-subxt-pr-maker',
  'smartdeploy-deployer',
  'dependabot-preview',
  'petr-hanzl',
  'paritytech-polkadotsdk-templatebot',
  'snyk-io',
  'galoybot-app',
  'figure-renovate',
  'corda-jenkins-ci02',
  'dependabot',
  'ipfs-mgmt-read-write',
  'codefactor-io',
  'libp2p-mgmt-read-write',
  'graphops-renovate',
  'filplus-github-bot-read-write',
  'imgbot',
  'tokenlistform',
  'pyca-boringbot'
];

const cutoffDate = new Date('2024-01-01');
async function query() {
  const dbUsers = await prisma.cryptoEcosystemAuthor.findMany();
  console.log(dbUsers.length);
  const logins = dbUsers.map((user) => user.login).filter((login) => !bots.includes(login));
  const users = await getGithubUsers({ logins });
  console.log('retrieved users', users.length);
  for (let user of users) {
    await prisma.cryptoEcosystemAuthor.update({
      where: {
        login: user.login
      },
      data: {
        email: user.email,
        xtra: {
          isHireable: user.isHireable,
          location: user.location
        },
        name: user.name,
        twitter: user.twitter
      }
    });
  }
  console.log('DONE');
  // const result2 = await prisma.cryptoEcosystemAuthor.count({});
  // console.log(result2);
}

query();
