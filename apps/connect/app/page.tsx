import { redirect } from 'next/navigation';

import { HomePage } from 'components/home/HomePage';

export default function Home() {
  const user = {}; // server action

  if (!user) {
    redirect('/welcome');
  }

  return <HomePage user={user} />;
}
