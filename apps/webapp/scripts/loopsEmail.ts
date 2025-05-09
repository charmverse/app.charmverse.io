import { registerLoopsContact } from 'lib/loopsEmail/registerLoopsContact';
import { deleteLoopsContact } from 'lib/loopsEmail/deleteLoopsContact';
import { sendSignupEvent } from 'lib/loopsEmail/sendSignupEvent';

const email = 'mattwad@gmail.com';

async function register() {
  const result = await registerLoopsContact({
    createdAt: new Date(2022, 1),
    username: 'Matt the I',
    email: email,
    emailNewsletter: true
  });
  console.log(result);
}

async function deleteUser() {
  const result = await deleteLoopsContact({
    email: email
  });
  console.log('result', result);
}

async function signup() {
  const result = await sendSignupEvent({
    email: email,
    isAdmin: true,
    spaceName: 'Matts bungalo',
    spaceTemplate: 'Test'
  });
  console.log('result', result);
}

signup().catch((error) => {
  console.error('Error', error);
  process.exit(1);
});
