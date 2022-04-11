import supertest from 'supertest';
import { prisma } from 'testing/setupDatabase';

describe('GET /pages/{pageId}', () => {

  it('should return the page', async () => {

    const user = await prisma.user.findFirst();
    // expect(user?.isBot).toBe(false);
    expect(user).toBe(null);
  });

});

export default {};
