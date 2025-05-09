import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { log } from '@charmverse/core/log';
import type { PullRequestSummary } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { askChatGPT } from '@packages/lib/chatGPT/askChatgpt';
import type { ChatGPTModel } from '@packages/lib/chatGPT/constants';
import { writeToSameFolder } from '@packages/lib/utils/file';

import { GITHUB_API_BASE_URL } from './constants';
import type { PullRequestToQuery } from './getPullRequestFileChanges';
import { getPullRequestFileChanges } from './getPullRequestFileChanges';
import { getPullRequestMeta } from './getPullRequestMeta';

type PullRequestFilePatch = {
  filename: string;
  additions: number;
  deletions: number;
  patch: string;
};

const promptAndFileSeparator = '----';

/**
 * @createdBy github username of pull request author
 * @summary Message used. Files changed should be delimited as {files}
 */
export type PullRequestSummaryWithFilePatches = Omit<PullRequestSummary, 'patches' | 'model'> & {
  patches: PullRequestFilePatch[];
  model: ChatGPTModel;
};

export function baseSummarisePRPrompt({ files }: { files: string }) {
  return `Please review this pull request

  Start from the back end, and explain it through to the client-side experience.

  Use this template. Do not refer to specific files, just focus on functionality and technical improvements.

  Backend
  - Features

  Frontend
  - User Interface components
  - New or updated user interactions

  ${promptAndFileSeparator}

  ${files}

  ${promptAndFileSeparator}

  Perform your analysis using the provided template. Focus on the overall changes.

  If the main change is a README.md file, focus the summary on improving documentation.

  Be concise and summarise well. Limit use of adjectives and adverbs.

  `;
}

/**
 * Summarise the PR, and return the summary with metadata
 * @param params
 * @returns
 */
export async function summarisePullRequest(
  params: PullRequestToQuery & { forceRefresh?: boolean }
): Promise<PullRequestSummaryWithFilePatches> {
  // Don't search for existing ones if we're forcing a refresh
  const existingSummary = params.forceRefresh
    ? null
    : await prisma.pullRequestSummary.findFirst({
        where: {
          prNumber: params.prNumber,
          repoOwner: params.repoOwner,
          repoName: params.repoName
        },
        orderBy: {
          // Always get the latest summary
          createdAt: 'desc'
        }
      });

  if (existingSummary) {
    log.info(
      `Pull request summary already exists for ${GITHUB_API_BASE_URL}/${params.repoOwner}/${params.repoName}/pull/${params.prNumber}`
    );
    return existingSummary as PullRequestSummaryWithFilePatches;
  }

  const pr = await getPullRequestMeta({
    number: params.prNumber,
    repo: params.repoName,
    owner: params.repoOwner
  });

  const files = await getPullRequestFileChanges(params);

  const prompt = baseSummarisePRPrompt({ files: JSON.stringify(files, null, 2) });

  log.info(`Summarising pull request ${params.repoOwner}/${params.repoName}/${params.prNumber}`);

  const selectedModel: ChatGPTModel = 'gpt4';

  const response = await askChatGPT({ prompt, model: selectedModel });

  const persistedSummary = await prisma.pullRequestSummary.create({
    data: {
      prTitle: pr.title,
      prNumber: params.prNumber,
      repoOwner: params.repoOwner,
      repoName: params.repoName,
      status: pr.mergedAt ? 'merged' : 'open',
      patches: files,
      model: selectedModel,
      additions: files.reduce((acc, file) => acc + file.additions, 0),
      deletions: files.reduce((acc, file) => acc + file.deletions, 0),
      changedFiles: files.length,
      createdBy: pr.author.login,
      prompt: prompt.split(promptAndFileSeparator)[0].trim(),
      promptTokens: response.inputTokens,
      summary: response.answer,
      summaryTokens: response.outputTokens
    }
  });

  return persistedSummary as PullRequestSummaryWithFilePatches;
}

// summarisePullRequest({
//   number: 4004,
//   repoOwner: 'charmverse',
//   repoName: 'app.charmverse.io',
//   githubUsername: 'motechFR',
//   status: 'merged'
// })
//   .then((obj) => console.log(obj.id))
//   .catch(console.error);

// askChatGPT({ prompt: baseSummarisePRPrompt({ prTitle: 'Refactor docusign' }) }).then(console.log);

const exportFileName = 'pullRequestSummaries-local.json';

async function exportSummaries() {
  const summaries = await prisma.pullRequestSummary.findMany({});

  await writeToSameFolder({ fileName: exportFileName, data: JSON.stringify(summaries, null, 2) });
}

async function importSummaries(fileName: string) {
  const summaries = JSON.parse(await readFile(path.join(__dirname, fileName), 'utf-8')) as PullRequestSummary[];

  let skipped = 0;

  log.info(`Importing ${summaries.length} pull request summaries`);

  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];
    const existing = await prisma.pullRequestSummary.findFirst({
      where: {
        prNumber: summary.prNumber,
        repoOwner: summary.repoOwner,
        repoName: summary.repoName,
        model: summary.model,
        prompt: summary.prompt
      }
    });

    if (!existing) {
      log.info(
        `${i + 1}/${summaries.length}  // Creating pull request summary for ${summary.repoOwner}/${summary.repoName}/${
          summary.prNumber
        }`
      );
      await prisma.pullRequestSummary.create({
        data: summary as any
      });
    } else {
      skipped += 1;
    }
  }

  log.info(`Imported ${summaries.length - skipped} pull request summaries and skipped ${skipped}`);
}
