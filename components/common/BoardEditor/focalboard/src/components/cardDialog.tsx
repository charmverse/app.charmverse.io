import { Box } from '@mui/system';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { BountyWithDetails } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';
import PageDialog from 'components/common/PageDialog';

type Props = {
  cardId: string
  onClose: () => void
  showCard: (cardId?: string) => void
  readonly: boolean
}

function CreateBountyButton(props: { pageId: string }) {
  const { pageId } = props;
  const { createDraftBounty } = useBounties();
  const { user } = useUser();
  const [space] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {!userSpacePermissions?.createBounty || !space || !user ? null : (
        <Button
          disableElevation
          size='small'
          onClick={() => createDraftBounty({ pageId, userId: user.id, spaceId: space.id })}
        >
          Convert to bounty
        </Button>
      )}
    </Box>
  );
}

const CardDialog = (props: Props): JSX.Element | null => {
  const { cardId, readonly, onClose } = props;
  const card = useAppSelector(getCard(cardId))
  const { pages } = usePages()
  const { draftBounty, cancelDraftBounty, bounties } = useBounties()
  const router = useRouter();
  const isSharedPage = router.route.startsWith('/share')
  const cardPage = pages[cardId]
  const [spacePermissions] = useCurrentSpacePermissions()
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null)

  useEffect(() => {
    setBounty(bounties.find(bounty => bounty.page?.id === cardId) ?? null)
  }, [bounties.length, cardId])

  // clear draft bounty on close, just in case
  useEffect(() => {
    return () => {
      cancelDraftBounty()
    }
  }, []);

  return card && pages[card.id] ? (
    <>
      <PageDialog
        onClose={onClose}
        readOnly={readonly}
        bounty={bounty}
        toolbar={
          spacePermissions?.createBounty && !isSharedPage && cardPage && !bounty && !draftBounty && !readonly && cardPage.type.match('template') === null && <CreateBountyButton pageId={cardId} />
        }
        page={cardPage}
      />
    </>
  ) : null
}
export default CardDialog;
