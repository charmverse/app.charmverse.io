import styled from '@emotion/styled';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useTrashPages } from 'charmClient/hooks/pages';
import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { KanbanPageActionsMenuButton } from 'components/common/PageActions/KanbanPageActionButton';
import { PageIcon } from 'components/common/PageIcon';
import { RewardStatusBadge } from 'components/rewards/components/RewardStatusBadge';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { isTouchScreen } from 'lib/utilities/browser';

import { useSortable } from '../../hooks/sortable';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  card: Card;
  board: Board;
  visiblePropertyTemplates: IPropertyTemplate[];
  isSelected: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  readOnly: boolean;
  onDrop?: (srcCard: Card, dstCard: Card) => void;
  // eslint-disable-next-line
  showCard: (cardId: string | null) => void;
  hideLinkedBounty?: boolean;
};

const BountyFooter = styled.div`
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

function RewardMetadata({ bountyId }: { bountyId: string }) {
  const { rewards } = useRewards();
  const linkedBounty = rewards?.find((r) => r?.id === bountyId);

  if (!linkedBounty) {
    return null;
  }

  return (
    <BountyFooter>
      <RewardStatusBadge reward={linkedBounty} truncate />
    </BountyFooter>
  );
}

const KanbanCard = React.memo((props: Props) => {
  const { card, board, onDrop } = props;
  const intl = useIntl();
  const [isDragging, isOver, cardRef] = useSortable(
    'card',
    card,
    !props.readOnly && !isTouchScreen() && !!onDrop,
    onDrop || (() => {})
  );
  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];
  let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard';
  if (isOver) {
    className += ' dragover';
  }

  const router = useRouter();
  const { pages } = usePages();
  const cardPage = pages[card.id];
  const domain = router.query.domain || /^\/share\/(.*)\//.exec(router.asPath)?.[1];
  const fullPageUrl = `/${domain}/${cardPage?.path}`;
  const { trigger: trashPages } = useTrashPages();

  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false);
  const handleDeleteCard = useCallback(async () => {
    await trashPages({ pageIds: [card.id], trash: true });
  }, [card.id, trashPages]);
  const confirmDialogProps: {
    heading: string;
    subText?: string;
    confirmButtonText?: string;
    onConfirm: () => void;
    onClose: () => void;
  } = {
    heading: intl.formatMessage({
      id: 'CardDialog.delete-confirmation-dialog-heading',
      defaultMessage: 'Confirm card delete?'
    }),
    confirmButtonText: intl.formatMessage({
      id: 'CardDialog.delete-confirmation-dialog-button-text',
      defaultMessage: 'Delete'
    }),
    onConfirm: handleDeleteCard,
    onClose: () => {
      setShowConfirmationDialogBox(false);
    }
  };
  const deleteCard = useCallback(() => {
    // user trying to delete a card with blank name
    // but content present cannot be deleted without
    // confirmation dialog
    if (card?.title === '' && card?.fields.contentOrder.length === 0) {
      handleDeleteCard();
      return;
    }
    setShowConfirmationDialogBox(true);
  }, [handleDeleteCard, setShowConfirmationDialogBox]);

  return (
    <>
      <Link href={fullPageUrl} draggable={false} color='inherit'>
        <StyledBox
          ref={props.readOnly ? () => null : cardRef}
          className={className}
          draggable={!props.readOnly}
          style={{ opacity: isDragging ? 0.5 : 1 }}
          onClick={(e) => {
            e.preventDefault();
            if (props.onClick) {
              props.onClick(e);
            }
          }}
          data-test={`kanban-card-${card.id}`}
        >
          {!props.readOnly && <KanbanPageActionsMenuButton page={cardPage} onClickDelete={deleteCard} />}

          <div className='octo-icontitle'>
            <div>
              {cardPage?.icon ? (
                <PageIcon isEditorEmpty={!cardPage.hasContent} pageType='page' icon={cardPage.icon} />
              ) : undefined}
            </div>
            <div key='__title' className='octo-titletext'>
              {cardPage?.title || intl.formatMessage({ id: 'KanbanCard.untitled', defaultMessage: 'Untitled' })}
            </div>
          </div>
          <Stack gap={0.5}>
            {visiblePropertyTemplates.map((template) => (
              <PropertyValueElement
                key={template.id}
                board={board}
                readOnly
                card={card}
                syncWithPageId={cardPage?.syncWithPageId}
                updatedAt={cardPage?.updatedAt.toString() || ''}
                updatedBy={cardPage?.updatedBy || ''}
                propertyTemplate={template}
                showEmptyPlaceholder={false}
                displayType='kanban'
                showTooltip
              />
            ))}
          </Stack>
          {!props.hideLinkedBounty && cardPage?.bountyId && <RewardMetadata bountyId={cardPage?.bountyId} />}
        </StyledBox>
      </Link>
      {showConfirmationDialogBox && (
        <ConfirmDeleteModal
          title={confirmDialogProps.heading}
          onClose={confirmDialogProps.onClose}
          open
          buttonText={confirmDialogProps.confirmButtonText}
          question={confirmDialogProps.subText}
          onConfirm={confirmDialogProps.onConfirm}
        />
      )}
    </>
  );
});

export default KanbanCard;
