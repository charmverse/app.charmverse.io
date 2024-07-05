import 'server-only';

import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';

import { NavBar } from './NavBar';

export async function Header() {
  const user = await getCurrentUser();

  return <NavBar user={user?.data} />;
}
