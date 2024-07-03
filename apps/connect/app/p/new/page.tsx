import { CreateProjectPage } from '@connect/components/projects/new/CreateProjectPage';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';

export default async function CreateProject() {
  const user = await getCurrentUser();

  if (!user?.data) {
    return null;
  }

  return <CreateProjectPage user={user.data} />;
}
