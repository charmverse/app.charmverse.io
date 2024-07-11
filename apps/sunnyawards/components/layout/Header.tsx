import 'server-only';

import { getCurrentUserAction } from 'lib/profile/getCurrentUserAction';

import { NavBar } from './NavBar';

export async function Header() {
  const user = await getCurrentUserAction({});

  return <NavBar user={user?.data} />;
}
