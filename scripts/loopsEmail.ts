import { registerNewUser } from 'lib/loopsEmail/registerNewUser';

export async function init() {
  const result = await registerNewUser({
    space: {
      name: 'Test'
    },
    isAdmin: true,
    user: {
      createdAt: new Date(2022, 1),
      username: 'Matt the I',
      email: 'mattwad@gmail.com'
    }
  });
  console.log(result);
}

init().catch((error) => {
  console.error('Error', error);
  process.exit(1);
});
