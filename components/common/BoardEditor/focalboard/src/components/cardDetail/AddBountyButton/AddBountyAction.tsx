import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';

type Props = {
  readOnly: boolean;
  cardId: string;
};

export default function AddBountyAction({ readOnly, cardId }: Props) {
  const router = useRouter();
  const { pages } = usePages();
  const [spacePermissions] = useCurrentSpacePermissions();
  const isSharedPage = router.route.startsWith('/share');
  const cardPage = pages[cardId];
  const { getFeatureTitle } = useSpaceFeatures();

  const { user } = useUser();
  const { space } = useCurrentSpace();

  const { setCreatingInlineReward, creatingInlineReward } = useRewards();

  const hasReward = !!cardPage?.bountyId;
  const canAddBounty =
    spacePermissions?.createBounty &&
    !isSharedPage &&
    cardPage &&
    !hasReward &&
    !creatingInlineReward &&
    !readOnly &&
    cardPage.type.match('template') === null &&
    spacePermissions?.createBounty &&
    space &&
    user;

  return canAddBounty ? (
    <AddAPropertyButton onClick={() => setCreatingInlineReward(true)}>
      <FormattedMessage id='CardDetail.add-bounty' defaultMessage={`+ Add a ${getFeatureTitle('reward')}`} />
    </AddAPropertyButton>
  ) : null;
}
