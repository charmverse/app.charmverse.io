import { ReposDashboard } from 'components/repos/ReposDashboard';
import { getRepos } from 'lib/repos/getRepos';

export default async function Dashboard() {
  const repos = await getRepos();
  return <ReposDashboard repos={repos} />;
}
