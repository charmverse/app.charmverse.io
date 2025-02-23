import { baseUrl } from '@packages/utils/constants';

export function getPagePermalink({ pageId }: { pageId: string }) {
  return `${baseUrl ?? 'https://app.charmverse.io'}/permalink/${pageId}`;
}

export function getSubmissionPagePermalink({ submissionId }: { submissionId: string }) {
  return `${baseUrl ?? 'https://app.charmverse.io'}/permalink/submission/${submissionId}`;
}
