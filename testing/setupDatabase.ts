import { createUserFromWallet } from 'lib/users/createUser';

export default async function seedDatabase () {
  await createUserFromWallet('0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078');
  // const user = await
  return true;
}
