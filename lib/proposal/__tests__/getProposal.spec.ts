import { v4 } from 'uuid';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { DataNotFoundError } from 'lib/utilities/errors';
import { createProposal } from '../createProposal';
import { getProposal } from '../getProposal';

describe('getProposal', () => {
  it('should return the proposal page content, permissions and proposal data', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
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
