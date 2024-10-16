import type { Metadata } from 'next';

import { GithubConnectPage } from 'components/welcome/github-connect/GithubConnectPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Github Connect'
};

export default async function GithubConnect({
  searchParams: { state, code, error }
}: {
  searchParams: { state: string; code: string; error: string };
}) {
  return <GithubConnectPage state={state} code={code} githubRedirectError={error} />;
}
