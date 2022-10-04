import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createProposal } from '../createProposal';
import { getProposal } from '../getProposal';

describe('getProposal', () => {
  it('should return the proposal page content, permissions and proposal data', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const { page: pageWithProposal } = await createProposal({
      createdBy: user.id,
      spaceId: space.id,
      title: 'page-title'
    });

    const proposal = await getProposal({
      proposalId: pageWithProposal.id
    });

    expect(proposal).toMatchObject(pageWithProposal);

  });

  it('should throw an error if the proposal does not exist', async () => {
    await expect(getProposal({ proposalId: v4() })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
