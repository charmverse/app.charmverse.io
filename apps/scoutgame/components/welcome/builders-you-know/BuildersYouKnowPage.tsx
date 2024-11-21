import { log } from '@charmverse/core/log';
import { currentSeason } from '@packages/scoutgame/dates';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { getScoutFarcasterBuilderSocialGraph } from '@packages/scoutgame/social/getScoutFarcasterBuilderSocialGraph';
import { baseUrl } from '@packages/utils/constants';
import { redirect } from 'next/navigation';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import { getBuildersByFid } from 'lib/builders/getBuildersByFid';

import { BuildersYouKnowContent } from './BuildersYouKnowContent';

async function loadBuilderContent({ fid }: { fid: number }) {
  try {
    const { followers, following } = await getScoutFarcasterBuilderSocialGraph({ fid });

    const { builders: buildersUserFollows } = await getBuildersByFid({
      fids: following,
      limit: 30,
      season: currentSeason
    });

    const { builders: buildersFollowingUser } = await getBuildersByFid({
      fids: followers,
      limit: 30,
      season: currentSeason
    });

    // Remove any builders that appear in both arrays to avoid duplicates
    const uniqueBuildersFollowingUser = buildersFollowingUser.filter(
      (follower) => !buildersUserFollows.some((followedByUser) => followedByUser.id === follower.id)
    );

    return {
      buildersFollowingUser: uniqueBuildersFollowingUser,
      buildersUserFollows
    };
  } catch (error) {
    log.error('Error loading builders you know content', { error });
    return null;
  }
}

export async function BuildersYouKnowPage() {
  const user = await getUserFromSession();

  const redirectUrl = `${(baseUrl as string) ?? 'https://scoutgame.xyz'}/home`;

  if (!user?.farcasterId) {
    redirect(redirectUrl);
  }

  const data = await loadBuilderContent({ fid: user.farcasterId });

  if (!data || (data.buildersFollowingUser.length === 0 && data.buildersUserFollows.length === 0)) {
    redirect((baseUrl as string) ?? 'https://scoutgame.xyz');
  }

  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <BuildersYouKnowContent
          followingBuilders={data.buildersFollowingUser}
          followedBuilders={data.buildersUserFollows}
        />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
