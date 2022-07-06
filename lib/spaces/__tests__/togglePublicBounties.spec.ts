import { v4 } from 'uuid';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { togglePublicBounties } from '../togglePublicBounties';
import { generateUserAndSpaceWithApiToken } from '../../../testing/setupDatabase';

describe('togglePublicBounties', () => {

  it('should update the space to the new value', async () => {

    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    let updatedSpace = await togglePublicBounties({
      spaceId: space.id,
      publicBountyBoard: false
    });

    expect(updatedSpace.id).toBe(space.id);
    expect(updatedSpace.publicBountyBoard).toBe(false);

    updatedSpace = await togglePublicBounties({
      spaceId: space.id,
      publicBountyBoard: true
    });

    expect(updatedSpace.publicBountyBoard).toBe(true);

  });

  it('should fail if an invalid value for public bounty board is provided', async () => {
    await expect(togglePublicBounties({
      spaceId: v4(),
      publicBountyBoard: 'Not a boolean' as any
    })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail if an invalid space id is provided', async () => {
    await expect(togglePublicBounties({
      spaceId: 'Not a valid uuid',
      publicBountyBoard: false
    })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail if the space does not exist', async () => {
    await expect(togglePublicBounties({
      spaceId: v4(),
      publicBountyBoard: false
    })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
