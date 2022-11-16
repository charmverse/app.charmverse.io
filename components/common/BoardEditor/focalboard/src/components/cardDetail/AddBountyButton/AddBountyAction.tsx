import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

type Props = {
  readOnly: boolean;
  cardId: string;
};

export default function AddBountyAction ({ readOnly, cardId }: Props) {
  const router = useRouter();
  const { pages } = usePages();
  const [spacePermissions] = useCurrentSpacePermissions();
  const isSharedPage = router.route.startsWith('/share');
  const cardPage = pages[cardId];
  const { draftBounty, cancelDraftBounty, bounties } = useBounties();
  const hasBounty = useMemo(() => {
    return !!bounties.find(bounty => bounty.page?.id === cardId) ?? null;
  }, [cardId, bounties]);
  const { user } = useUser();
  const space = useCurrentSpace();
  const { createDraftBounty } = useBounties();

  // clear draft bounty on close, just in case
  useEffect(() => {
    return () => {
      cancelDraftBounty();
    };
  }, []);

  const canAddBounty = spacePermissions?.createBounty
    && !isSharedPage
    && cardPage
    && !hasBounty
    && !draftBounty
    && !readOnly
    && cardPage.type.match('template') === null
    && spacePermissions?.createBounty
    && space
    && user;

  return (
    canAddBounty
      ? (
        <div className='octo-propertyname add-property'>
          <Button onClick={() => createDraftBounty({ pageId: cardId, userId: user.id, spaceId: space.id })}>
            <FormattedMessage
              id='CardDetail.add-bounty'
              defaultMessage='+ Add a bounty'
            />
          </Button>
        </div>
      )
      : null
  );
}
