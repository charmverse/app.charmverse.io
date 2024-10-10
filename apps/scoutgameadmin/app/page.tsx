import { redirect } from 'next/navigation';

export default async function Dashboard() {
  redirect('/repos');
}
