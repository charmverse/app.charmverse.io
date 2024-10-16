import type { Metadata } from 'next';

import { BuilderSetupPage } from 'components/welcome/builder-setup/BuilderSetupPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Github Connect'
};

export default async function BuilderSetup({
  searchParams: { state, code, error }
}: {
  searchParams: { state: string; code: string; error: string };
}) {
  return <BuilderSetupPage state={state} code={code} githubRedirectError={error} />;
}
