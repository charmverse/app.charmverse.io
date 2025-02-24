import { getCurrentUser } from '@packages/connect-shared/lib/profile/getCurrentUser';
import { findProject } from '@packages/connect-shared/lib/projects/findProject';
import { getSession } from '@packages/connect-shared/lib/session/getSession';
import { notFound, redirect } from 'next/navigation';

import { EditProjectPage } from 'components/projects/edit/EditProjectPage';

export default async function EditProject({
  params
}: {
  params: {
    path: string;
  };
}) {
  const session = await getSession();
  const [project, user] = await Promise.all([
    findProject({
      path: params.path
    }),
    getCurrentUser(session?.user?.id)
  ]);

  if (!user) {
    return null;
  }

  if (!user?.connectOnboarded) {
    redirect('/welcome');
  }

  if (!project) {
    return notFound();
  }

  return <EditProjectPage project={project} user={user} />;
}
