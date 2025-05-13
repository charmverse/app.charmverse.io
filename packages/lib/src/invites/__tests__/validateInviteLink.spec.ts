import { testUtils } from '@charmverse/core/test';
import { createMockSpace } from '@packages/testing/mocks/space';
import { v4 } from 'uuid';

import type { InviteLinkPopulated } from '../getInviteLink';
import { validateInviteLink } from '../validateInviteLink';

const space = createMockSpace();

const linkStub: Omit<InviteLinkPopulated, 'maxAgeMinutes' | 'maxUses' | 'useCount'> = {
  code: 'ABC',
  createdAt: new Date(),
  createdBy: '123',
  id: '123',
  visibleOn: null,
  spaceId: v4(),
  space
};

describe('validateInviteLink', () => {
  it('should mark the link as valid if there are remaining uses and the link has not expired', () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 60,
      maxUses: 1,
      useCount: 0,
      ...linkStub
    };

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(true);
  });

  it('should mark the link as valid if max uses is -1 and the link has not expired', () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 60,
      maxUses: -1,
      useCount: 0,
      ...linkStub
    };

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(true);
  });

  it('should mark the link as valid if maxAgeMinutes is -1 and the max uses have not been exceeded', () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: -1,
      maxUses: 1,
      useCount: 0,
      ...linkStub
    };

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(true);
  });

  it('should mark the link as valid if it is a proposal link, and the space has enabled public proposals, ignoring other parameters', async () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 0.01,
      maxUses: 1,
      useCount: 1,
      ...linkStub,
      visibleOn: 'proposals',
      space: {
        ...linkStub.space,
        publicProposals: true
      }
    };

    // Link has both exceeded max uses and expired, but it is a proposal link and the space has enabled public proposals
    await testUtils.sleep(1000);

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(true);
  });

  it('should mark the link as invalid if uses have been exceeded', () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 60,
      maxUses: 1,
      useCount: 1,
      ...linkStub
    };

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(false);
    expect(validated.reason).toBe('maxUsesExceeded');
  });

  it('should mark the link as invalid if it is a proposal link, but the space has not enabled public proposals', () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 60,
      maxUses: 1,
      useCount: 1,
      ...linkStub,
      visibleOn: 'proposals',
      space: {
        ...linkStub.space,
        publicProposals: false
      }
    };

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(false);
    expect(validated.reason).toBe('publicProposalsDisabled');
  });

  it('should mark the link as invalid if the max age has been exceeded', async () => {
    const invite: InviteLinkPopulated = {
      maxAgeMinutes: 0.01,
      maxUses: 1,
      useCount: 0,
      ...linkStub
    };

    await testUtils.sleep(1000);

    const validated = validateInviteLink({ invite });
    expect(validated.valid).toBe(false);
    expect(validated.reason).toBe('expired');
  });
});
