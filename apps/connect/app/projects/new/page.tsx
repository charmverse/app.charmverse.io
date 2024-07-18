import { redirect } from 'next/navigation';

import { CreateProjectPage } from 'components/projects/new/CreateProjectPage';
import { getCurrentUser } from 'lib/actions/getCurrentUser';

export default async function CreateProject() {
  const user = await getCurrentUser();

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.connectOnboarded) {
    redirect('/welcome');
  }

  return <CreateProjectPage user={user.data} />;
}
