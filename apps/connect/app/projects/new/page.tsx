import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import { redirect } from 'next/navigation';

import { CreateProjectPage } from 'components/projects/new/CreateProjectPage';

export default async function CreateProject() {
  const user = await getCurrentUserAction();

  if (!user?.data) {
    redirect('/');
  }

  if (!user?.data?.connectOnboarded) {
    redirect('/welcome');
  }

  return <CreateProjectPage user={user.data} />;
}
