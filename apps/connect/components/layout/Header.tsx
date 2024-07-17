import 'server-only';

import { getCurrentUser } from 'lib/actions/getCurrentUser';

import { NavBar } from './components/NavBar';

export async function Header() {
  const user = await getCurrentUser();

  return <NavBar user={user?.data} />;
}
