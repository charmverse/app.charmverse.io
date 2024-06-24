import { HomePage } from '@connect/components/home/HomePage';
import { redirect } from 'next/navigation';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default function Home() {
  const user = undefined; // server action

  if (user) {
    redirect('/dashboard');
  }

  return <HomePage user={user} />;
}
