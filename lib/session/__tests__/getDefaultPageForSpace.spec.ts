import { generateUserAndSpace } from 'testing/setupDatabase';

import { getDefaultPageForSpace } from '../getDefaultPageForSpace';

describe('getDefaultPageForSpace()', () => {
  it('should send user to last visited forum page', async () => {
    const { space, user } = await generateUserAndSpace();
    const url = getDefaultPageForSpace({ spaceId: space.id, userId: user.id });
    expect(url).toEqual('/members');
  });

  it('should send user to last visited static page', async () => {
    const { space, user } = await generateUserAndSpace();
    const url = getDefaultPageForSpace({ spaceId: space.id, userId: user.id });
    expect(url).toEqual('/members');
  });

  it('should send user to last visited document page', async () => {
    const { space, user } = await generateUserAndSpace();
    const url = getDefaultPageForSpace({ spaceId: space.id, userId: user.id });
    expect(url).toEqual('/members');
  });

  it('should send user to first top-level page by default', async () => {
    const { space, user } = await generateUserAndSpace();
    const url = getDefaultPageForSpace({ spaceId: space.id, userId: user.id });
    expect(url).toEqual('/members');
  });

  it('should send user to /members page when no other pages are available', async () => {
    const { space, user } = await generateUserAndSpace();
    const url = getDefaultPageForSpace({ spaceId: space.id, userId: user.id });
    expect(url).toEqual('/members');
  });
});
