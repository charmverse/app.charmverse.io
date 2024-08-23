import { getCurrentUser } from '@connect-shared/lib/profile/getCurrentUser';
import { findProject } from '@connect-shared/lib/projects/findProject';
import { notFound, redirect } from 'next/navigation';

import { EditProjectPage } from 'components/projects/edit/EditProjectPage';

export default async function EditProject({
  params
}: {
  params: {
    path: string;
  };
}) {
  const [project, user] = await Promise.all([
    findProject({
      path: params.path
    }),
    getCurrentUser()
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
