import type { LoggedInUser } from '@root/lib/profile/getUser';

import charmClient from 'charmClient';
import { useMembers } from 'hooks/useMembers';
import { useSpaces } from 'hooks/useSpaces';

export type OnboardingStep = 'email_step' | 'profile_step';

export function useOnboarding({ spaceId, user }: { spaceId?: string; user: LoggedInUser | null }) {
  const { members, mutateMembers, isValidating: isLoadingMembersForSpace } = useMembers();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const userId = user?.id;

  async function completeOnboarding() {
    if (userId && spaceId) {
      await charmClient.spaces.completeOnboarding({
        spaceId
      });
      mutateMembers(members.map((member) => (member.id === userId ? { ...member, onboarded: true } : member)));
    }
  }

  const spaceMember = members.find((member) => member.id === userId);
  const showOnboardingFlow =
    !isLoadingMembersForSpace && isSpacesLoaded && !spaceMember?.isGuest && spaceMember?.onboarded === false;
  // Maybe in the future we could save this as a flag, but assume if user has joined a space already then they've already seen the terms and conditions
  const hasSeenTermsAndConditions = spaces.length > 1;
  const onboardingStep: OnboardingStep = hasSeenTermsAndConditions ? 'profile_step' : 'email_step';

  return {
    isGuest: spaceMember?.isGuest,
    onboardingStep: showOnboardingFlow ? onboardingStep : undefined,
    hasSeenTermsAndConditions,
    completeOnboarding
  };
}
