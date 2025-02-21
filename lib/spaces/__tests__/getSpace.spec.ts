import { InvalidInputError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';

import { getSpace } from '../getSpace';

describe('getSpace', () => {
  let spaceUuid: string;
  let spaceDomain: string;

  beforeAll(async () => {
    const { space } = await generateUserAndSpace();
    spaceUuid = space.id;
    spaceDomain = space.domain;
  });

  it('should retrieve a space by UUID', async () => {
    const space = await getSpace(spaceUuid);
    expect(space).toBeDefined();
    expect(space.id).toBe(spaceUuid);
  });

  it('should retrieve a space by domain', async () => {
    const space = await getSpace(spaceDomain);
    expect(space).toBeDefined();
    expect(space.domain).toBe(spaceDomain);
  });

  it('should throw InvalidInputError if input is an empty string', async () => {
    await expect(getSpace('')).rejects.toThrow(InvalidInputError);
  });

  it('should throw InvalidInputError if input is not provided', async () => {
    // TypeScript may prevent calling the function without arguments,
    // hence using any to bypass type checking in this test scenario.
    await expect(getSpace(undefined as any)).rejects.toThrow(InvalidInputError);
  });

  it('should throw if input does not match any existing UUID or domain', async () => {
    await expect(getSpace('nonExistingId')).rejects.toThrow();
  });
});
