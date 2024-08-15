import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
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
    getCurrentUserAction()
  ]);

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.connectOnboarded) {
    redirect('/welcome');
  }

  if (!project) {
    return notFound();
  }

  return <EditProjectPage project={project} user={user.data} />;
}
