import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
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
  const { tempReward, rewards, createReward, setTempReward } = useRewards();
  const hasBounty = useMemo(() => {
    return !!rewards?.find((reward) => reward.id === cardId) ?? null;
  }, [cardId, rewards]);
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const canAddBounty =
    spacePermissions?.createBounty &&
    !isSharedPage &&
    cardPage &&
    !hasBounty &&
    !readOnly &&
    cardPage.type.match('template') === null &&
    spacePermissions?.createBounty &&
    space &&
    user;

  return canAddBounty ? (
    <AddAPropertyButton onClick={() => setTempReward({ linkedPageId: cardId, userId: user.id, spaceId: space.id })}>
      <FormattedMessage id='CardDetail.add-bounty' defaultMessage='+ Add a bounty' />
    </AddAPropertyButton>
  ) : null;
}
