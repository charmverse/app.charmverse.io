import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { redirect } from 'next/navigation';

import { CreateProjectPage } from 'components/projects/new/CreateProjectPage';
import { getUnimportedOptimismProjectsAction } from 'lib/projects/getUnimportedOptimismProjectsAction';

export const dynamic = 'force-dynamic';

export default async function CreateProject() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (!user?.connectOnboarded) {
    redirect('/welcome');
  }

  const optimismProjects = await getUnimportedOptimismProjectsAction().catch(() => null);

  return <CreateProjectPage user={user} optimismProjects={optimismProjects?.data ?? []} />;
}
