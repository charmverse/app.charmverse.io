import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default function Home() {
  const user = undefined; // server action

  if (user) {
    redirect('/profile');
  }

  return <HomePage user={user} />;
}
