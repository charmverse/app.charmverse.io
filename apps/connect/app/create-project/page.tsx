import CreateProject from '@connect/components/projects/CreateProject';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';

export default async function CreateProjectPage() {
  const user = await getCurrentUser();

  if (!user?.data) {
    return null;
  }

  return <CreateProject user={user.data} />;
}
