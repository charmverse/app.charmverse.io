import { prisma } from '@charmverse/core/prisma-client';

import fs from 'fs';

// read list of repos from repos.txt in your CWD
const repos = fs
  .readFileSync(process.cwd() + '/repos.txt', 'utf8')
  .split('\n')
  .map((repo) => repo.trim());

async function importRepos() {
  let added = 0;
  // call github api to get repo id and default branch for each repo
  for (const repo of repos) {
    const [owner, name] = repo.trim().split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}`);
    const data = await response.json();
    //  console.log(data);
    if (data.id) {
      console.log(`repo:`, owner, name, data.id, data.default_branch);
      await prisma.githubRepo.upsert({
        where: {
          id: data.id
        },
        create: {
          id: data.id,
          owner,
          name,
          defaultBranch: data.default_branch
        },
        update: {}
      });
      added++;
    } else {
      console.log(`repo not found:`, owner, name, data);
    }
  }
  console.log(`Added ${added} repos`);
}

importRepos();
