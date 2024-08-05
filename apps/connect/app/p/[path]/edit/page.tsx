import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import { fetchProject } from '@connect-shared/lib/projects/fetchProject';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { EditProjectPage } from 'components/projects/edit/EditProjectPage';

export const metadata: Metadata = {
  title: 'Edit Project'
};

export default async function EditProject({
  params
}: {
  params: {
    path: string;
  };
}) {
  const [project, user] = await Promise.all([
    fetchProject({
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
