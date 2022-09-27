import { Box } from '@mui/system';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { BountyWithDetails } from 'lib/bounties';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';
import PageDialog from 'components/common/PageDialog';
import { AllowedPagePermissions } from 'lib/permissions/pages';

type Props = {
  cardId: string
  onClose: () => void
  showCard: (cardId?: string) => void
  readonly: boolean
}

const CardDialog = (props: Props): JSX.Element | null => {
  const { cardId, readonly, onClose } = props;
  const card = useAppSelector(getCard(cardId))
  const { pages } = usePages()
  const { bounties } = useBounties()
  const cardPage = pages[cardId]
  const bounty = useMemo(() => {
    return bounties.find(bounty => bounty.page?.id === cardId) ?? null
  }, [cardId, bounties.length])

  return card && pages[card.id] ? (
    <>
      <PageDialog
        onClose={onClose}
        readOnly={readonly}
        bounty={bounty}
        page={cardPage}
      />
    </>
  ) : null
}
export default CardDialog;
