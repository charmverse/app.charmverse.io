import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { isTouchScreen } from 'lib/utilities/browser';

import type { Board, IPropertyTemplate } from '../../blocks/board';
import type { Card } from '../../blocks/card';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import Tooltip from '../../widgets/tooltip';
import PropertyValueElement from '../propertyValueElement';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })}
`;

type Props = {
  board: Board;
  card: Card;
  onClick: (e: React.MouseEvent, card: Card) => void;
  visiblePropertyTemplates: IPropertyTemplate[];
  visibleTitle: boolean;
  isSelected: boolean;
  readOnly: boolean;
  isManualSort: boolean;
  onDrop: (srcCard: Card, dstCard: Card) => void;
}

const GalleryCard = React.memo((props: Props) => {
  const { card, board } = props;
  const { pages, getPagePermissions } = usePages();
  const space = useCurrentSpace();
  const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readOnly && !isTouchScreen(), props.onDrop);
  const cardPage = pages[card.id];
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard';
  if (isOver) {
    className += ' dragover';
  }

  const galleryImageUrl: null | string | undefined = cardPage?.headerImage || cardPage?.galleryImage;

  const pagePermissions = getPagePermissions(card.id);

  const deleteCard = () => {
    mutator.deleteBlock(card, 'delete card');
  };

  const duplicateCard = () => {
    if (space && cardPage) {
      mutator.duplicateCard({
        cardId: card.id,
        board,
        cardPage,
        afterRedo: async () => {
          mutate(`pages/${space.id}`);
        }
      });
    }
  };

  return (
    cardPage ? (
      <StyledBox
        className={className}
        onClick={(e: React.MouseEvent) => props.onClick(e, card)}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        ref={cardRef}
      >
        {!props.readOnly
        && (
          <>
            <IconButton
              size='small'
              className='icons'
              onClick={handleClick}
            >
              <MoreHorizIcon color='secondary' fontSize='small' />
            </IconButton>
            <PageActions
              anchorEl={anchorEl}
              onClick={handleClose}
              open={open}
              page={cardPage}
              onClickDuplicate={duplicateCard}
              onClickDelete={pagePermissions.delete && cardPage.deletedAt === null ? deleteCard : undefined}
            />
          </>
        )}
        {galleryImageUrl
        && (
          <div className='gallery-image'>
            <img
              className='ImageElement'
              src={galleryImageUrl}
              alt='Gallery item'
            />
          </div>
        )}
        {!galleryImageUrl
          && <div className='gallery-item' />}
        {props.visibleTitle
        && (
          <div className='gallery-title'>
            {cardPage?.icon ? <PageIcon isEditorEmpty={!cardPage?.hasContent} pageType='card' icon={cardPage.icon} /> : undefined}
            <div key='__title'>
              {cardPage?.title
              || (
                <FormattedMessage
                  id='KanbanCard.untitled'
                  defaultMessage='Untitled'
                />
              )}
            </div>
          </div>
        )}
        {visiblePropertyTemplates.length > 0
        && (
          <div className='gallery-props'>
            {visiblePropertyTemplates.map((template) => (
              <Tooltip
                key={template.id}
                title={template.name}
                placement='top'
              >
                <PropertyValueElement
                  updatedAt={cardPage?.updatedAt.toString() || ''}
                  updatedBy={cardPage?.updatedBy || ''}
                  board={board}
                  readOnly={true}
                  card={card}
                  propertyTemplate={template}
                  showEmptyPlaceholder={false}
                />
              </Tooltip>
            ))}
          </div>
        )}
      </StyledBox>
    ) : null
  );
});

export default GalleryCard;

