import type { InviteLinkPopulated } from './getInviteLink';

export type InvalidReason = 'expired' | 'maxUsesExceeded' | 'publicProposalsDisabled';

export type ValidatedLinkResults = {
  valid: boolean;
  reason?: InvalidReason;
  message?: string;
};

function isOutOfDate({ invite }: { invite: { createdAt: Date; maxAgeMinutes: number } }): boolean {
  const timePassed =
    Date.now() - (typeof invite.createdAt === 'string' ? new Date(invite.createdAt) : invite.createdAt).getTime();
  const expired = timePassed > invite.maxAgeMinutes * 60 * 1000;
  return expired;
}

export function validateInviteLink({ invite }: { invite: InviteLinkPopulated }): ValidatedLinkResults {
  if (invite.visibleOn === 'proposals') {
    const isValid = invite.space.publicProposals === true;
    return {
      valid: isValid,
      reason: isValid ? undefined : 'publicProposalsDisabled',
      message: 'Public proposals are disabled'
    };
  } else if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return { valid: false, reason: 'maxUsesExceeded', message: 'Max uses exceeded' };
  } else if (invite.maxAgeMinutes > 0 && isOutOfDate({ invite })) {
    return { valid: false, reason: 'expired', message: 'Invite expired' };
  } else {
    return { valid: true };
  }
}
