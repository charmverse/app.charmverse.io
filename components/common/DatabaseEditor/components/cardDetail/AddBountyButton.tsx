import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';
import type { Card } from 'lib/databases/card';

import { AddAPropertyButton } from '../properties/AddAProperty';

type Props = {
  readOnly: boolean;
  card: Card;
};

export function AddBountyButton({ readOnly, card }: Props) {
  const router = useRouter();
  const [spacePermissions] = useCurrentSpacePermissions();
  const isSharedPage = router.route.startsWith('/share');
  const { getFeatureTitle } = useSpaceFeatures();

  const { user } = useUser();
  const { space } = useCurrentSpace();

  const { setCreatingInlineReward, creatingInlineReward } = useRewards();

  const hasReward = !!card?.bountyId;
  const canAddBounty =
    spacePermissions?.createBounty &&
    !isSharedPage &&
    card &&
    !hasReward &&
    !creatingInlineReward &&
    !readOnly &&
    !card.pageType?.startsWith('card') &&
    card.pageType?.match('template') === null &&
    spacePermissions?.createBounty &&
    space &&
    user;

  return canAddBounty ? (
    <AddAPropertyButton onClick={() => setCreatingInlineReward(true)}>
      <FormattedMessage id='CardDetail.add-bounty' defaultMessage={`+ Add a ${getFeatureTitle('reward')}`} />
    </AddAPropertyButton>
  ) : null;
}
