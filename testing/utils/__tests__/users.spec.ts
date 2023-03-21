import { v4 } from 'uuid';

import { prisma } from 'db';

import { generateUser } from '../users';

describe('generateUser', () => {
  it('should generate a user with a random name and verified email if provided', async () => {
    const email = `test-${v4()}@example.com`;
    const user = await generateUser({ verifiedEmail: email });

    expect(user.identityType).toBe('RandomName');

    const generated = await prisma.verifiedEmail.findUnique({
      where: {
        email
      }
    });

    expect(generated).toBeTruthy();
    expect(generated?.email).toBe(email);
    expect(generated?.userId).toBe(user.id);
  });
});
