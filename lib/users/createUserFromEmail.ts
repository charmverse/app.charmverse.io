import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { InvalidInputError } from 'lib/utilities/errors';
import { isValidEmail } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

type UserFromEmailInput = {
  email: string;
};

export async function createUserFromEmail({ email }: UserFromEmailInput): Promise<LoggedInUser> {
  if (!isValidEmail(email)) {
    throw new InvalidInputError(`Invalid email address: ${email}`);
  }

  const user = await prisma.user.upsert({
    where: {
      primaryEmail: email
    },
    create: {
      username: email,
      primaryEmail: email
    },
    update: {},
    include: sessionUserRelations
  });

  return user;
}
