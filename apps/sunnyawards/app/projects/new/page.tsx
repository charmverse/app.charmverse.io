import { getCurrentUser } from '@packages/connect-shared/lib/profile/getCurrentUser';
import { getSession } from '@packages/connect-shared/lib/session/getSession';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { NewProjectPage } from 'components/projects/new/NewProjectPage';
import { getUnimportedOptimismProjectsAction } from 'lib/projects/getUnimportedOptimismProjectsAction';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'New Project'
};

export default async function CreateProject() {
  const session = await getSession();
  const user = await getCurrentUser(session.user?.id);

  if (!user) {
    return null;
  }

  if (!user?.connectOnboarded) {
    redirect('/welcome');
  }

  const optimismProjects = await getUnimportedOptimismProjectsAction().catch(() => null);

  return <NewProjectPage user={user} optimismProjects={optimismProjects?.data ?? []} />;
}
