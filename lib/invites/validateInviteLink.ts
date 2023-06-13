import type { InviteLinkPopulated } from './getInviteLink';

export type InvalidReason = 'expired' | 'maxUsesExceeded' | 'publicProposalsDisabled';

export type ValidatedLink = {
  invite: InviteLinkPopulated;
  valid: boolean;
  reason?: InvalidReason;
};

function isOutOfDate({ invite }: { invite: InviteLinkPopulated }): boolean {
  const timePassed = Date.now() - invite.createdAt.getTime();
  const expired = timePassed > invite.maxAgeMinutes * 60 * 1000;
  return expired;
}

export function validateInviteLink({ invite }: { invite: InviteLinkPopulated }): ValidatedLink {
  if (invite.visibleOn === 'proposals') {
    const isValid = invite.space.publicProposals === true;
    return { invite, valid: isValid, reason: isValid ? undefined : 'publicProposalsDisabled' };
  } else if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return { invite, valid: false, reason: 'maxUsesExceeded' };
  } else if (invite.maxAgeMinutes > 0 && isOutOfDate({ invite })) {
    return { invite, valid: false, reason: 'expired' };
  } else {
    return { invite, valid: true };
  }
}
