import { randomIntFromInterval } from '@packages/utils/random';
import { askChatGPT } from '@root/lib/chatGPT/askChatgpt';

import {
  getPullRequestFileChanges,
  type GithubFileChange,
  type PullRequestToQuery
} from '../getPullRequestFileChanges';
import { getPullRequestMeta } from '../getPullRequestMeta';
import type { PullRequestSummaryWithFilePatches } from '../summarisePullRequest';
import { baseSummarisePRPrompt, summarisePullRequest } from '../summarisePullRequest';

jest.mock('lib/chatGPT/askChatgpt');
jest.mock('lib/github/getPullRequestMeta');
jest.mock('lib/github/getPullRequestFileChanges');

const mockedAskChatGPT = askChatGPT as jest.MockedFunction<typeof askChatGPT>;
const mockedGetPullRequestFileChanges = getPullRequestFileChanges as jest.MockedFunction<
  typeof getPullRequestFileChanges
>;
const mockedGetPullRequestMeta = getPullRequestMeta as jest.MockedFunction<typeof getPullRequestMeta>;
const exampleFileChanges: GithubFileChange[] = [
  {
    sha: '1',
    filename: 'src/index.js',
    status: 'modified',
    additions: 10,
    deletions: 2,
    changes: 12,
    blob_url: 'https://github.com/repo/blob/1',
    raw_url: 'https://github.com/repo/raw/1',
    contents_url: 'https://github.com/repo/contents/1',
    patch: 'patch1'
  },
  // This file should be ignored
  {
    sha: '2',
    filename: 'package-lock.json',
    status: 'modified',
    additions: 200,
    deletions: 100,
    changes: 300,
    blob_url: 'https://github.com/repo/blob/2',
    raw_url: 'https://github.com/repo/raw/2',
    contents_url: 'https://github.com/repo/contents/2',
    patch: 'patch2'
  },
  {
    sha: '3',
    filename: 'src/utils.js',
    status: 'added',
    additions: 20,
    deletions: 0,
    changes: 20,
    blob_url: 'https://github.com/repo/blob/3',
    raw_url: 'https://github.com/repo/raw/3',
    contents_url: 'https://github.com/repo/contents/3',
    patch: 'patch3'
  }
];

const filteredFiles = exampleFileChanges.filter((file) => file.filename !== 'package-lock.json');

const totalAdditions = filteredFiles.reduce((acc, file) => acc + file.additions, 0);
const totalDeletions = filteredFiles.reduce((acc, file) => acc + file.deletions, 0);

const exampleResponse = {
  answer: 'This pull request includes changes to multiple files, fixing bugs and improving functionality.',
  inputTokens: 1500,
  outputTokens: 50
};

const exampleOwner = `owner-${randomIntFromInterval(1, 1000)}`;
const exampleRepo = `repo-${randomIntFromInterval(1, 1000)}`;

const params: PullRequestToQuery = {
  prNumber: randomIntFromInterval(1, 1000),
  repoOwner: exampleOwner,
  repoName: exampleRepo
};

const expectedSummary: Partial<PullRequestSummaryWithFilePatches> = {
  prNumber: params.prNumber,
  prTitle: 'Example',
  repoOwner: params.repoOwner,
  repoName: params.repoName,
  status: 'merged',
  patches: exampleFileChanges.filter((file) => file.filename !== 'package-lock.json'),
  additions: totalAdditions,
  deletions: totalDeletions,
  changedFiles: 2,
  createdBy: 'dev',
  prompt: baseSummarisePRPrompt({
    files: JSON.stringify(
      exampleFileChanges.filter((file) => file.filename !== 'package-lock.json'),
      null,
      2
    )
  }),
  promptTokens: exampleResponse.inputTokens,
  summary: exampleResponse.answer,
  summaryTokens: exampleResponse.outputTokens
};

mockedAskChatGPT.mockResolvedValue({ inputTokens: 10, outputTokens: 20, answer: 'output' });
mockedGetPullRequestFileChanges.mockResolvedValue([]);
mockedGetPullRequestMeta.mockResolvedValue({
  title: 'Example',
  author: { login: 'dev' },
  additions: 1,
  deletions: 1,
  number: randomIntFromInterval(1, 10000),
  createdAt: new Date().toString(),
  mergedAt: new Date().toString(),
  repository: {
    nameWithOwner: 'demo-owner/demo-repo'
  },
  url: 'www.repo.com'
});

describe('summarisePullRequest', () => {
  beforeEach(() => {
    mockedGetPullRequestFileChanges.mockClear();
    mockedAskChatGPT.mockClear();
  });

  it('should fetch, summarise, and store pull request summary', async () => {
    mockedGetPullRequestFileChanges.mockResolvedValueOnce(
      exampleFileChanges.filter((file) => file.filename !== 'package-lock.json')
    );
    mockedAskChatGPT.mockResolvedValueOnce(exampleResponse);

    const result = await summarisePullRequest(params);

    expect(mockedGetPullRequestFileChanges).toHaveBeenCalled();

    expect(mockedAskChatGPT).toHaveBeenCalledWith({
      prompt: expectedSummary.prompt,
      model: 'gpt4'
    });

    expect(result).toMatchObject(
      expect.objectContaining<Partial<PullRequestSummaryWithFilePatches>>({
        additions: expectedSummary.additions,
        deletions: expectedSummary.deletions,
        changedFiles: expectedSummary.changedFiles,
        summary: expectedSummary.summary
      })
    );
  });

  it('should return existing summary if it exists without requerying the AI model', async () => {
    await summarisePullRequest(params);

    expect(mockedAskChatGPT).not.toHaveBeenCalled();
  });
});
