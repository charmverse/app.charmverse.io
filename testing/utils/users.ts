import { prisma } from 'db';

export async function addUserGoogleAccount({
  userId,
  avatarUrl = '',
  name = '',
  email
}: {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  await prisma.googleAccount.create({
    data: {
      name,
      avatarUrl,
      email,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
}
