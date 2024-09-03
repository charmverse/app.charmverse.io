import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'path';
import { prettyPrint } from 'lib/utils/strings';
import { getRepositoryActivity } from './getRepositoryActivity';
import { prisma } from '@charmverse/core/prisma-client';
import { uniqBy, sortBy, uniq } from 'lodash';

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

/**
 * Use this script to perform database searches.
 */

const cutoffDate = new Date('2024-01-01');

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
