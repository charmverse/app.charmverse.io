import { registerLoopsContact } from 'lib/loopsEmail/registerLoopsContact';
import { updateLoopsContact } from 'lib/loopsEmail/updateLoopsContact';

async function register() {
  const result = await registerLoopsContact({
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

async function subscribe(enable = true) {
  const result = await updateLoopsContact({
    email: 'mattwad@gmail.com',
    subscribed: false
  });
  console.log('result', result);
}

subscribe().catch((error) => {
  console.error('Error', error);
  process.exit(1);
});
