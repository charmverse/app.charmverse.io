import { stringify } from 'csv-stringify/sync';

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'path';
import { prettyPrint } from 'lib/utils/strings';
import { getRepositoryActivity } from './getRepositoryActivity';

type Project = {
  // Ecosystem Level Information
  title: string;
  // These are the titles of other ecosystems in different .toml files in the /data/ecosystems directory
  sub_ecosystems: [];
  // This is a list of links to associated GitHub organizations.
  github_organizations: string[]; // ["https://github.com/zeroexchange"]
  // These are structs including a url and tags for a git repository. These URLs do not necessarily have to be on GitHub.
  repo: { url: string; missing?: boolean }[]; // { url:  "https://github.com/zeroexchange/0-charts" }
};

const sourceFile = resolve(process.cwd(), '../crypto-ecosystems-export/projects.json');

async function readProjects() {
  const file = await readFile(sourceFile);
  const data: Project[] = JSON.parse(file.toString());
  return data;
}

/**
 * Use this script to perform database searches.
 */

async function query() {
  // const commits = await getRepoCommits({ owner: 'charmverse', repo: 'app.charmverse.io' });
  // console.log('FIRST RESULT');

  // const contributors = getHumanContributors(commits);
  // console.log('contributors', contributors);

  const projects = await readProjects();
  console.log('Projects', projects.length);
  console.log('Repos', projects.map((p) => p.repo).flat().length);

  const repos = projects
    .filter((p) => p.title === 'Optimism')
    .map((p) => p.repo)
    .flat()
    .map((r) => r.url);

  console.log('Retrieving repositories', repos);

  const repoData = await getRepositoryActivity({ repos });
  const sortedData = repoData.sort((a, b) => b.stargazerCount - a.stargazerCount);
  const data = stringify(sortedData, { header: true, columns: Object.keys(repoData[0]), delimiter: '\t' });

  await writeFile(`repo_activity.tsv`, data);

  return sortedData;
}

query();
