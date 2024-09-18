import { getRecentClosedOrMergedPRs } from './getPullRequests';

export async function processPullRequests() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // console.log('Processing pull requests');
  const prs = await getRecentClosedOrMergedPRs({
    owner: 'charmverse',
    repo: 'app.charmverse.io',
    after: last24Hours
  });
  // console.log('prs', prs);
}
