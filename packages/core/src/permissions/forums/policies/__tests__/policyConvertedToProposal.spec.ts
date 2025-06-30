import type { Post, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from 'prisma-client';

import { generateForumPost } from '../../../../testing/forums';
import { generateProposal } from '../../../../testing/proposals';
import { generateSpaceUser, generateUserAndSpace } from '../../../../testing/user';
import { AvailablePostPermissions } from '../../availablePostPermissions.class';
import { policyConvertedToProposal } from '../policyConvertedToProposal';

describe('policyConvertedToProposal', () => {
  let space: Space;
  let admin: User;
  let author: User;
  let member: User;
  let post: Post;
  let postConvertedToProposal: Post;
  const fullPermissionFlags = new AvailablePostPermissions({ isReadonlySpace: false }).full;
  const emptyPermissionFlags = new AvailablePostPermissions({ isReadonlySpace: false }).empty;

  beforeAll(async () => {
    const generated = await generateUserAndSpace({
      isAdmin: true
    });
    space = generated.space;
    admin = generated.user;
    author = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    member = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    post = await generateForumPost({
      userId: author.id,
      spaceId: space.id
    });
    postConvertedToProposal = await generateForumPost({
      userId: author.id,
      spaceId: space.id
    });
    const proposal = await generateProposal({
      spaceId: space.id,
      userId: author.id
    });
    postConvertedToProposal = await prisma.post.update({
      where: {
        id: postConvertedToProposal.id
      },
      data: {
        proposalId: proposal.id
      }
    });
  });

  it('should not have an effect if post proposalId is null', async () => {
    const updated = await policyConvertedToProposal({
      flags: { ...fullPermissionFlags },
      resource: post,
      userId: member.id
    });

    expect(updated).toEqual(fullPermissionFlags);
  });

  it('should not remove the delete or view permissions from the author', async () => {
    const updated = await policyConvertedToProposal({
      flags: fullPermissionFlags,
      resource: postConvertedToProposal,
      userId: author.id
    });

    expect(updated).toEqual({
      ...emptyPermissionFlags,
      delete_post: true,
      view_post: true
    });
  });
  it('should not allow a space member to delete or edit a post converted to a proposal, but still allow them to view it', async () => {
    const updated = await policyConvertedToProposal({
      flags: fullPermissionFlags,
      resource: postConvertedToProposal,
      userId: member.id
    });

    expect(updated).toEqual({
      ...emptyPermissionFlags,
      view_post: true
    });
  });

  it('should not remove any permission from a space admin', async () => {
    const updated = await policyConvertedToProposal({
      flags: { ...fullPermissionFlags },
      resource: postConvertedToProposal,
      userId: admin.id,
      isAdmin: true
    });

    expect(updated).toEqual(fullPermissionFlags);
  });
});
