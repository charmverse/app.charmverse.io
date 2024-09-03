import { stringify } from 'csv-stringify/sync';
import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
import { writeFile } from 'node:fs/promises';

type PullRequestRow = {
  Date: string;
  Repo: string;
  Ecosystem: string;
  Builder: string;
  Title: string;
};

async function exportPullRequests() {
  const pullRequests = await prisma.cryptoEcosystemPullRequest.findMany({
    include: {
      ecosystem: true,
      repo: true,
      author: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  const rows: PullRequestRow[] = pullRequests.map((pr) => {
    const xtra = pr.xtra as { title: string };
    return {
      Date: pr.date.toLocaleDateString(),
      Repo: pr.repo.url.replace('https://github.com/', ''),
      Ecosystem: pr.ecosystem.title,
      Builder: pr.author.login,
      Title: xtra.title
    };
  });
  const data = stringify(rows, { header: true, columns: Object.keys(rows[0]), delimiter: '\t' });

  await writeFile(`pull_requests.tsv`, data);
  console.log('Exported', rows.length, 'pull_requests');
}

type BuilderRow = {
  Login: string;
  Name: string;
  Email: string;
  Twitter: string;
  Location: string;
  isHireable: string;
  // aggregate data
  Repos: number;
  Ecosystems: number;
  PullRequests: number;
};

async function exportBuilders() {
  const builders = await prisma.cryptoEcosystemAuthor.findMany({
    include: {
      pullRequests: {
        include: {
          ecosystem: true,
          repo: true
        }
      }
    }
  });
  const rows: BuilderRow[] = builders.map((row) => {
    const xtra = row.xtra as { isHireable?: boolean; location?: string | null };
    const repos = uniq(row.pullRequests.map((pr) => pr.repo.url));
    const ecosystems = uniq(row.pullRequests.map((pr) => pr.ecosystem.title));
    return {
      Login: row.login,
      Name: row.name || '',
      Email: row.email || '',
      Twitter: row.twitter || '',
      Location: xtra.location || '',
      isHireable: xtra.isHireable ? 'Yes' : '',
      // aggregate data
      Repos: repos.length,
      Ecosystems: ecosystems.length,
      PullRequests: row.pullRequests.length
    };
  });
  const data = stringify(rows, { header: true, columns: Object.keys(rows[0]), delimiter: '\t' });

  await writeFile(`builders.tsv`, data);
  console.log('Exported', rows.length, 'builders');
}

type RepositoryRow = {
  Url: string;
  Ecosystem: string;
  Stars: number;
  Watchers: number;
  Forks: number;
  // based on season date
  Builders: number;
  PullRequests: number;
};

async function exportRepos() {
  const builders = await prisma.cryptoEcosystemRepo.findMany({
    include: {
      pullRequests: true
    }
  });
  const rows: RepositoryRow[] = builders.map((row) => {
    const builders = uniq(row.pullRequests.map((pr) => pr.userGithubLogin));
    return {
      Url: row.url,
      Ecosystem: row.ecosystemTitle,
      Stars: row.stargazerCount,
      Watchers: row.watcherCount,
      Forks: row.forkCount,
      // based on season date
      Builders: builders.length,
      PullRequests: row.pullRequests.length
    };
  });
  const data = stringify(rows, { header: true, columns: Object.keys(rows[0]), delimiter: '\t' });

  await writeFile(`repos.tsv`, data);
  console.log('Exported', rows.length, 'repos');
}

type EcosystemRow = {
  Title: string;
  'Sub Ecosystems': number;
  'Parent Ecosystems': number;
  Repos: number;
  Stars: number;
  Watchers: number;
  Forks: number;
  // based on season date
  Builders: number;
  PullRequests: number;
  // include sub ecosystem counts
  'Repos (With Subs)': number;
  'stars (With Subs)': number;
  'Watchers (With Subs)': number;
  'Forks (With Subs)': number;
  'Builders (With Subs)': number;
  'Pull_requests (With Subs)': number;
};

async function exportEcosystems() {
  const ecosystems = await prisma.cryptoEcosystem.findMany({
    include: {
      repos: true,
      pullRequests: true,
      children: {
        include: {
          child: {
            include: {
              repos: true,
              pullRequests: true
            }
          }
        }
      },
      parents: true
    }
  });
  const rows: EcosystemRow[] = ecosystems.map((row) => {
    const builders = uniq(row.pullRequests.map((pr) => pr.userGithubLogin));
    const childStats = row.children.reduce<Record<string, number>>((acc, child) => {
      const childBuilders = uniq(child.child.pullRequests.map((pr) => pr.userGithubLogin));
      acc.repos += child.child.repos.length;
      acc.stars += child.child.repos.reduce((acc, r) => acc + r.stargazerCount, 0);
      acc.watchers += child.child.repos.reduce((acc, r) => acc + r.watcherCount, 0);
      acc.forks += child.child.repos.reduce((acc, r) => acc + r.forkCount, 0);
      acc.builders += childBuilders.length;
      acc.pullRequests += child.child.pullRequests.length;
      return acc;
    }, {});
    return {
      Title: row.title,
      'Sub Ecosystems': row.children.length,
      'Parent Ecosystems': row.parents.length,
      Repos: row.repos.length,
      Stars: row.repos.reduce((acc, r) => acc + r.stargazerCount, 0),
      Watchers: row.repos.reduce((acc, r) => acc + r.watcherCount, 0),
      Forks: row.repos.reduce((acc, r) => acc + r.forkCount, 0),
      // based on season date
      Builders: builders.length,
      PullRequests: row.pullRequests.length,
      // include sub ecosystem counts
      'Repos (With Subs)': row.repos.length + childStats.repos,
      'stars (With Subs)': row.repos.reduce((acc, r) => acc + r.stargazerCount, 0) + childStats.stars,
      'Watchers (With Subs)': row.repos.reduce((acc, r) => acc + r.watcherCount, 0) + childStats.watchers,
      'Forks (With Subs)': row.repos.reduce((acc, r) => acc + r.forkCount, 0) + childStats.forks,
      'Builders (With Subs)': builders.length + childStats.builders,
      'Pull_requests (With Subs)': row.pullRequests.length + childStats.pullRequests
    };
  });
  const data = stringify(rows, { header: true, columns: Object.keys(rows[0]), delimiter: '\t' });
  await writeFile(`ecosystems.tsv`, data);
  console.log('Exported', rows.length, 'ecosystems');
}

async function exportData() {
  await exportPullRequests();
  await exportBuilders();
  await exportRepos();
  await exportEcosystems();
}

exportData();
