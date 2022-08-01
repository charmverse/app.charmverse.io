// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import LinkIcon from '@mui/icons-material/Link'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import { List, ListItemButton, ListItemText } from '@mui/material'
import { Box } from '@mui/system'
import charmClient from 'charmClient'
import Button from "components/common/Button"
import { useBounties } from 'hooks/useBounties'
import { useCurrentSpace } from 'hooks/useCurrentSpace'
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions'
import { usePages } from 'hooks/usePages'
import { useSnackbar } from 'hooks/useSnackbar'
import { useUser } from 'hooks/useUser'
import { AssignedBountyPermissions } from 'lib/bounties'
import { BountyWithDetails } from 'models'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Board } from '../blocks/board'
import mutator from '../mutator'
import { getCard } from '../store/cards'
import { useAppSelector } from '../store/hooks'
import { Utils } from '../utils'
import CardDetail from './cardDetail/cardDetail'
import ConfirmationDialogBox, { ConfirmationDialogBoxProps } from './confirmationDialogBox'
import Dialog from './dialog'

type Props = {
  board: Board
  cardId: string
  onClose: () => void
  showCard: (cardId?: string) => void
  readonly: boolean
}

function CreateBountyButton(props: {
  onClick: (createdBounty: BountyWithDetails) => void
  pageId: string
}) {
  const { onClick, pageId } = props;
  const { setBounties } = useBounties();
  const [user] = useUser();
  const [space] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {!userSpacePermissions?.createBounty || !space || !user ? null : (
        <Button onClick={async () => {
          const createdBounty = await charmClient.createBounty({
            chainId: 1,
            status: "open",
            spaceId: space.id,
            createdBy: user.id,
            rewardAmount: 1,
            rewardToken: "ETH",
            linkedPageId: pageId,
            permissions: {
              submitter: [{
                group: "space",
                id: space.id
              }]
            }
          })
          setBounties((bounties) => [...bounties, createdBounty])
          onClick(createdBounty)
        }}>
          Create bounty
        </Button>
      )}
    </Box>
  );
}

const CardDialog = (props: Props): JSX.Element | null => {
  const { cardId, readonly, onClose } = props;
  const card = useAppSelector(getCard(cardId))
  const intl = useIntl()
  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
  const { pages } = usePages()
  const { refreshBounty, bounties } = useBounties()
  const router = useRouter();
  const isSharedPage = router.route.startsWith('/share')
  const cardPage = pages[cardId]
  const [spacePermissions] = useCurrentSpacePermissions()
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null)
  const [permissions, setPermissions] = useState<AssignedBountyPermissions | null>(null);

  const { showMessage } = useSnackbar()

  useEffect(() => {
    setBounty(bounties.find(bounty => bounty.page?.id === cardId) ?? null)
  }, [bounties, cardId])

  async function refreshBountyPermission(bountyId: string) {
    setPermissions(await charmClient.computeBountyPermissions({
      resourceId: bountyId
    }));
  }

  useEffect(() => {
    if (bounty) {
      refreshBountyPermission(bounty.id)
    }
  }, [bounty])

  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure()
      return
    }
    // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: card.id})
    await mutator.deleteBlock(card, 'delete card')
    onClose()
  }

  const confirmDialogProps: ConfirmationDialogBoxProps = {
    heading: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete?' }),
    confirmButtonText: intl.formatMessage({ id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete' }),
    onConfirm: handleDeleteCard,
    onClose: () => {
      setShowConfirmationDialogBox(false)
    },
  }

  const handleDeleteButtonOnClick = () => {
    // use may be renaming a card title
    // and accidently delete the card
    // so adding des
    if (card?.title === '' && card?.fields.contentOrder.length === 0) {
      handleDeleteCard()
      return
    }

    setShowConfirmationDialogBox(true)
  }

  async function closeBounty () {
    const updatedBounty = await charmClient.closeBounty(bounty!.id);
    refreshBounty(updatedBounty.id);
  }

  return card && pages[card.id] ? (
    <>
      <Dialog
        onClose={onClose}
        hideCloseButton
        toolsMenu={!readonly && <List dense>
          <ListItemButton onClick={handleDeleteButtonOnClick}>
            <DeleteIcon sx={{
              mr: 1
            }} fontSize='small' />
            <ListItemText primary='Delete' />
          </ListItemButton>
          <ListItemButton onClick={() => {
            let cardLink = window.location.href

            const queryString = new URLSearchParams(window.location.search)
            if (queryString.get('cardId') !== card!.id) {
              const newUrl = new URL(window.location.toString())
              newUrl.searchParams.set('cardId', card!.id)
              cardLink = newUrl.toString()
            }

            Utils.copyTextToClipboard(cardLink)
            showMessage('Copied card link to clipboard', 'success')
          }}>
            <LinkIcon sx={{
              mr: 1
            }} fontSize='small' />
            <ListItemText primary='Copy link' />
          </ListItemButton>
          <ListItemButton onClick={closeBounty}>
            <CheckCircleIcon sx={{
              mr: 1
            }} fontSize="small"/>
            <ListItemText primary="Mark complete"/>
          </ListItemButton>
        </List>}
        toolbar={!isSharedPage && (
          <Box display="flex" justifyContent={"space-between"}>
            <Button
              size='small'
              color='secondary'
              href={`/${router.query.domain}/${pages[card.id]!.path}`}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}>
              Open as Page
            </Button>
            {spacePermissions?.createBounty && !isSharedPage && cardPage && !bounty && !readonly && <CreateBountyButton onClick={(createdBounty) => {
              setBounty(createdBounty)
            }} pageId={cardId} />}
          </Box>
        )
        }
      >
        {card && card.fields.isTemplate &&
          <div className='banner'>
            <FormattedMessage
              id='CardDialog.editing-template'
              defaultMessage="You're editing a template."
            />
          </div>}
        {card &&
          <CardDetail
            card={card}
            readonly={Boolean(readonly || isSharedPage)}
          />}

        {!card &&
          <div className='banner error'>
            <FormattedMessage
              id='CardDialog.nocard'
              defaultMessage="This card doesn't exist or is inaccessible."
            />
          </div>}
      </Dialog>

      {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps} />}
    </>
  ) : null
}
export default CardDialog
