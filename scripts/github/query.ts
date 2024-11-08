import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'path';
import { prettyPrint } from 'lib/utils/strings';
import { getRepositoryActivity, FlatRepositoryData, queryRepos, octokit } from './getRepositoryActivity';
import { prisma } from '@charmverse/core/prisma-client';
import { uniqBy, sortBy, uniq } from 'lodash';
import { getGithubUsers } from './getGithubUsers';

type Ecosystem = {
  // Ecosystem Level Information
  title: string;
  // These are the titles of other ecosystems in different .toml files in the /data/ecosystems directory
  sub_ecosystems: string[];
  // This is a list of links to associated GitHub organizations.
  github_organizations: string[]; // ["https://github.com/zeroexchange"]
  // These are structs including a url and tags for a git repository. These URLs do not necessarily have to be on GitHub.
  repo: { url: string; missing?: boolean }[]; // { url:  "https://github.com/zeroexchange/0-charts" }
};

export const bots = [
  'github-actions',
  'etc-contribunator',
  'homarr-renovate',
  'playground-manager',
  'feisar-bot',
  'spicerabot',
  'simplificator-renovate',
  'phillip-ground',
  'danmharris-renovate',
  'rosey-the-renovator-bot',
  'renovate-bot-github-app',
  'nix-flake-updater-sandhose',
  'octo-sts',
  'anaconda-renovate',
  'leather-bot',
  '404-bot',
  'renovate-bot-github-app',
  'repo-jeeves',
  'ibis-squawk-bot',
  'tyriis-automation',
  'doug-piranha-bot',
  'shipwasher',
  'aisling-bot',
  'codewarden-bot',
  'budimanjojo-bot',
  'smurf-bot',
  'glad-os-bot',
  'gabe565-renovate',
  'self-hosted-test',
  'dextek-bot',
  'robodexo2000',
  'bot-akira',
  'unhesitatingeffectivebot',
  'hoschi-bot',
  'mchesterbot',
  'ishioni-bot',
  'k3s-home-gha-bot',
  'fld-01',
  'home-gitops-renovate',
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
  'deepsource-autofix',
  'graphops-renovate',
  'filplus-github-bot-read-write',
  'imgbot',
  'paritytech-substrate-connect-pr',
  'tokenlistform',
  'pyca-boringbot'
];

const sourceFile = resolve(process.cwd(), '../crypto-ecosystems-export/projects.json');

export async function readEcosystems() {
  const file = await readFile(sourceFile);
  const data: (Partial<Ecosystem> & { title: string })[] = JSON.parse(file.toString());
  // remove projects that have no repo
  const withRepos = data.filter((p) => p.repo && p.repo.length > 0);
  // aggregate duplicate records by title
  const groupedMap = withRepos.reduce<Record<string, Ecosystem>>((acc, p) => {
    if (acc[p.title]) {
      acc[p.title].sub_ecosystems = uniq(acc[p.title].sub_ecosystems.concat(p.sub_ecosystems || []));
      acc[p.title].github_organizations = uniq(acc[p.title].github_organizations.concat(p.github_organizations || []));
      acc[p.title].repo = uniqBy(acc[p.title].repo.concat(p.repo || []), 'url');
    } else {
      acc[p.title] = {
        sub_ecosystems: [],
        repo: [],
        github_organizations: [],
        ...p
      };
    }
    return acc;
  }, {});
  const deduped = Object.values(groupedMap);
  // sort by # of repos, most to least
  return sortBy(deduped, (system) => system.repo.length).reverse();
}

async function recordSubsystems() {
  const ecosystems = await readEcosystems();
  const withChildren = ecosystems.filter((e) => e.sub_ecosystems?.length > 0);
  for (let ecosystem of withChildren) {
    const existing = await prisma.cryptoEcosystem.findMany({
      where: {
        title: {
          in: ecosystem.sub_ecosystems
        }
      }
    });
    await prisma.cryptoEcosystemChild.createMany({
      data: existing.map((subsystem) => ({
        parentTitle: ecosystem.title,
        childTitle: subsystem.title
      }))
    });
  }
}

async function updateUsers() {
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
    if (users.indexOf(user) % 100 === 0) {
      console.log('updated', users.indexOf(user));
    }
  }
  console.log('DONE');
}
/**
 * Use this script to perform database searches.
 */

const cutoffDate = new Date('2024-06-01');

async function query() {
  // const commits = await getRepoCommits({ owner: 'charmverse', repo: 'app.charmverse.io' });
  // console.log('FIRST RESULT');

  // const contributors = getHumanContributors(commits);
  // console.log('contributors', contributors);

  const projects = await readEcosystems();
  const ecosystems = await prisma.cryptoEcosystem.findMany();
  const repos = await prisma.cryptoEcosystemRepo.findMany();
  const newProjects = uniqBy(
    projects.filter((p) => !ecosystems.some((system) => system.title === p.title)),
    'title'
  );
  console.log('Projects without repos', projects.length - projects.length);
  console.log('Projects left to retrieve', newProjects.length);
  console.log('Saved repos', repos.length);
  // return;
  // console.log('Repos', projects.map((p) => p.repo).flat().length);

  for (let i = 0; i < newProjects.length; i++) {
    try {
      const ecosystem = newProjects[i];
      const uniqRepos = uniqBy(
        (ecosystem.repo || []).filter((r) => !repos.some((repo) => repo.url === r.url)),
        'url'
      );
      const repoData = await getRepositoryActivity({
        cutoffDate: cutoffDate,
        repos: uniqRepos.map((r) => r.url) || []
      });
      const newRepos = uniqBy(
        repoData.filter((r) => !repos.some((repo) => repo.githubId === r.id)),
        'id'
      );
      const existingRepos = repoData.filter((r) => repos.some((repo) => repo.githubId === r.id));
      if (existingRepos.length > 0) {
        console.log(
          'Ignore existing repos for ecosystem',
          ecosystem.title,
          existingRepos.map((r) => r.url)
        );
      }
      const existing = await prisma.cryptoEcosystemRepo.findMany({
        where: {
          githubId: {
            in: newRepos.map((r) => r.id)
          }
        }
      });
      const completelyNew = newRepos.filter((r) => !existing.some((repo) => repo.githubId === r.id));
      if (completelyNew.length !== newRepos.length) {
        console.log('Ignore existing repos for ecosystem 2', ecosystem.title, newRepos.length - completelyNew.length);
        console.log(newRepos.filter((r) => existing.some((repo) => repo.githubId === r.id)).map((r) => r.url));
      }
      await prisma.cryptoEcosystem.create({
        data: {
          title: ecosystem.title,
          repoUrls: ecosystem.repo?.map((r) => r.url).filter(Boolean) || [],
          organizations: ecosystem.github_organizations,
          repos: {
            createMany: {
              data: completelyNew.map((r) => ({
                githubId: r.id,
                url: r.url,
                assignableUsers: r.assignableUserCount,
                stargazerCount: r.stargazerCount,
                // pullRequestCount: r.pullRequestCount,
                pullRequestAuthorsCount: r.recentPullRequestAuthors,
                watcherCount: r.watcherCount,
                // releaseCount: r.releaseCount,
                forkCount: r.forkCount
              }))
            }
          }
        }
      });
      for (let author of repoData.flatMap((r) => r.authors)) {
        await prisma.cryptoEcosystemAuthor.upsert({
          where: {
            login: author.login
          },
          create: {
            login: author.login
          },
          update: {
            login: author.login
          }
        });
      }
    } catch (error) {
      console.error('Error processing', newProjects[i].title, error);
      continue;
    }
    if (i % 10 === 0) {
      console.log('Processed', i, 'of', newProjects.length, 'ecosystems');
    }
  }
}

async function queryRepoActivity() {
  // const commits = await getRepoCommits({ owner: 'charmverse', repo: 'app.charmverse.io' });
  // console.log('FIRST RESULT');
  const repos = await prisma.githubRepo.findMany({
    where: { handPicked: true }
  });
  // console.log('Repos', projects.map((p) => p.repo).flat().length);

  const repoActivity = await getRepositoryActivity({
    cutoffDate: cutoffDate,
    repos: repos.map((r) => `${r.owner}/${r.name}`)
  });
  // write to file
  await writeFile('repoActivity2.json', JSON.stringify(repoActivity, null, 2));
}

queryRepoActivity();
