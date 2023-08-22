import useSWR from 'swr';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { createPostPublication } from 'lib/lens/createPostPublication';

export function useNewLensPublication() {
  const { user } = useUser();
  const { data: lensProfile } = useSWR(user ? `public/profile/${user.id}/lens` : null, () =>
    charmClient.publicProfile.getLensProfile(user!.id)
  );

  const createPublication = async ({ contentText, proposalLink }: { contentText: string; proposalLink: string }) => {
    if (!lensProfile) {
      return;
    }

    const postPublication = await createPostPublication({
      contentText,
      proposalLink,
      lensProfile
    });

    return postPublication;
  };

  return {
    createPublication
  };
}
