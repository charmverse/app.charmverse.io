import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';
import { uniq, uniqBy } from 'lodash';
import { octokit } from '@packages/github/client';
import fs from 'fs';

type Row = {
  farcaster: number | undefined;
  github: string | undefined;
  githubRaw: string | undefined;
  email: string | undefined;
  name: string | undefined;
  userId: string | undefined;
  source: 'Team Lead of Project w/Github' | 'Proposal Answer' | 'Project Member Profile';
};

async function query() {
  const projects = await prisma.project.findMany({
    where: {
      github: {
        not: null
      }
    },
    select: {
      github: true,
      projectMembers: {
        include: {
          user: {
            include: {
              farcasterUser: true,
              verifiedEmails: true,
              googleAccounts: true
            }
          }
        }
      }
    }
  });
  const projectGithubs: Row[] = projects
    .filter((p) => p.github)
    .map((p) => {
      const teamLead = p.projectMembers.find((pm) => pm.teamLead);
      return {
        github: sanitizeGithub(p.github),
        githubRaw: p.github || undefined,
        name: teamLead?.user?.username,
        farcaster: teamLead?.user?.farcasterUser?.fid,
        email:
          teamLead?.user?.verifiedEmails[0]?.email ||
          teamLead?.user?.googleAccounts[0]?.email ||
          teamLead?.user?.email ||
          undefined,
        userId: teamLead?.user?.id,
        source: 'Team Lead of Project w/Github'
      };
    });
  console.log(projectGithubs.length, 'projects have github');
  const projectMembers = await prisma.projectMember.findMany({
    where: {
      socialUrls: {
        isEmpty: false
      }
    },
    include: {
      user: {
        include: {
          farcasterUser: true,
          verifiedEmails: true,
          googleAccounts: true
        }
      }
    }
  });
  const projectMemberGithubs: Row[] = projectMembers
    .filter((pm) => pm.socialUrls.find((url) => url.includes('github.com')))
    .filter(Boolean)
    .map((pm) => {
      const github = pm.socialUrls.find((url) => url.includes('github.com'));
      return {
        github: sanitizeGithub(github),
        githubRaw: github || undefined,
        name: pm.user?.username,
        farcaster: pm.user?.farcasterUser?.fid,
        email: pm.user?.verifiedEmails[0]?.email || pm.user?.googleAccounts[0]?.email || pm.user?.email || undefined,
        userId: pm.user?.id,
        source: 'Project Member Profile'
      };
    });
  console.log(projectMemberGithubs.length, 'out of', projectMembers.length, 'project members have github');
  const formFields = await prisma.formField.findMany({
    where: {
      type: 'short_text',
      name: {
        search: 'github'
      }
    },
    include: {
      answers: {
        select: {
          value: true,
          proposal: {
            select: {
              page: {
                select: {
                  author: {
                    include: {
                      farcasterUser: true,
                      verifiedEmails: true,
                      googleAccounts: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  console.log(formFields.length, 'form fields');
  const githubAnswers: Row[] = formFields
    .flatMap((ff) => ff.answers)
    .filter((a) => a.value)
    .map((a) => ({
      github: sanitizeGithub(a.value as string),
      githubRaw: a.value as string,
      name: a.proposal?.page?.author?.username,
      farcaster: a.proposal?.page?.author?.farcasterUser?.fid,
      email:
        a.proposal?.page?.author?.verifiedEmails[0]?.email ||
        a.proposal?.page?.author?.googleAccounts[0]?.email ||
        a.proposal?.page?.author?.email ||
        undefined,
      userId: a.proposal?.page?.author?.id,
      source: 'Proposal Answer'
    }));
  console.log(githubAnswers.length, 'answers');

  const rows = uniqBy(
    [...projectMemberGithubs, ...githubAnswers, ...projectGithubs]
      // filter out strings with whitespace inside
      .filter((raw) => raw.github && raw.github.length > 2 && !/\s/.test(raw.github) && !raw.github.includes('@')),
    'userId'
  );

  const scouts = await prisma.scout.findMany({
    where: {
      githubUser: {
        some: {
          login: {
            in: rows.map((r) => r.github!)
          }
        }
      }
    },
    include: {
      githubUser: true
    }
  });
  const scoutGithubs = scouts.flatMap((s) => s.githubUser?.map((gu) => gu.login));

  console.log(rows.length, 'logins');
  console.log('found', scouts.length, 'scouts', scoutGithubs.length);
  const newRows = rows.filter((r) => !scoutGithubs.some((gu) => gu === r.github));
  console.log(newRows.length, 'new rows');
  const rowsWithNoEmail = newRows.filter((r) => !r.email);
  console.log(rowsWithNoEmail.length, 'rows with no email');

  let errored: Record<string, boolean> = {};
  for (const row of rowsWithNoEmail) {
    try {
      const { data: user } = await octokit.rest.users.getByUsername({
        username: row.github!
      });
      if (user.email) {
        console.log(`Found email for ${row.github}: ${user.email}`);
        row.email = user.email;
      }
    } catch (error) {
      console.error(`Failed to fetch user ${row.github}:`, (error as any).response);
      console.log(row);
      errored[row.userId!] = true;
    }
  }
  console.log(Object.keys(errored).length, 'errored');
  fs.writeFileSync('charmverse-builders.json', JSON.stringify(newRows, null, 2));
  await generateCsv();

  // write to file
  // fs.writeFileSync('charmverse-builders.json', JSON.stringify(users, null, 2));
}

function generateCsv() {
  const builders = JSON.parse(fs.readFileSync('charmverse-builders.json', 'utf-8'));

  // Get all unique headers
  const headers = Array.from(new Set(builders.flatMap(Object.keys)));

  // Create CSV content starting with headers
  const csvContent = [
    headers.join(','),
    ...builders
      .filter((b: any) => b.email && b.email.includes('@'))
      .map((builder: any) =>
        headers
          .map((header) => {
            const value = builder[header as string] || '';
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      )
  ].join('\n');

  fs.writeFileSync('charmverse-builders.csv', csvContent);
  console.log('CSV file generated successfully');
}

function sanitizeGithub(raw?: string | null) {
  if (!raw) return undefined;
  return raw
    .replace(/^.*github\.com\/users\//, '')
    .replace(/^.*github\.com\/orgs\//, '')
    .replace(/^.*github\.com\//, '')
    .split('?')[0]
    .split('/')[0]
    .trim()
    .replace(/^-$/, '')
    .replace(/^N\/A$/i, '')
    .replace(/^NA$/i, '');
}

generateCsv();
