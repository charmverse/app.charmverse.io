import styled from '@emotion/styled';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { mutate } from 'swr';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { KanbanPageActionsMenuButton } from 'components/common/PageActions/KanbanPageActionButton';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { RewardStatusBadge } from 'components/rewards/components/RewardStatusBadge';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { isTouchScreen } from 'lib/utilities/browser';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  card: Card;
  board: Board;
  visiblePropertyTemplates: IPropertyTemplate[];
  isSelected: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  readOnly: boolean;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  // eslint-disable-next-line
  showCard: (cardId: string | null) => void;
  isManualSort: boolean;
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

const KanbanCard = React.memo((props: Props) => {
  const { card, board } = props;
  const intl = useIntl();
  const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readOnly && !isTouchScreen(), props.onDrop);
  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];
  let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard';
  if (props.isManualSort && isOver) {
    className += ' dragover';
  }
  const { space } = useCurrentSpace();

  const { rewards } = useRewards();
  const router = useRouter();
  const { pages } = usePages();
  const cardPage = pages[card.id];
  const linkedBounty = rewards?.find((r) => r?.id === cardPage?.bountyId);
  const domain = router.query.domain || /^\/share\/(.*)\//.exec(router.asPath)?.[1];
  const fullPageUrl = `/${domain}/${cardPage?.path}`;

  const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false);
  const handleDeleteCard = useCallback(async () => {
    await mutator.deleteBlock({ id: card.id, type: card.type }, 'delete card');
    mutate(`pages/${space?.id}`);
  }, [card.id, card.type, space?.id]);
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
                readOnly={true}
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
          {linkedBounty && (
            <BountyFooter>
              <RewardStatusBadge reward={linkedBounty} truncate />
            </BountyFooter>
          )}
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
