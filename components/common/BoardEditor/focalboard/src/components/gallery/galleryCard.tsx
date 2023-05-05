import styled from '@emotion/styled';
import { Box } from '@mui/material';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions/PageActions';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { isTouchScreen } from 'lib/utilities/browser';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
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
};

const GalleryCard = React.memo((props: Props) => {
  const { card, board } = props;
  const { pages } = usePages();
  const [isDragging, isOver, cardRef] = useSortable(
    'card',
    card,
    props.isManualSort && !props.readOnly && !isTouchScreen(),
    props.onDrop
  );
  const cardPage = pages[card.id];

  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard';
  if (isOver) {
    className += ' dragover';
  }

  const galleryImageUrl: null | string | undefined = cardPage?.headerImage || cardPage?.galleryImage;

  const deleteCard = () => {
    mutator.deleteBlock(card, 'delete card');
  };

  return cardPage ? (
    <StyledBox
      className={className}
      onClick={(e: React.MouseEvent) => props.onClick(e, card)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      ref={cardRef}
      data-test={`gallery-card-${card.id}`}
    >
      {!props.readOnly && <PageActions page={cardPage} onClickDelete={deleteCard} />}
      {galleryImageUrl && (
        <div className='gallery-image'>
          <img className='ImageElement' src={galleryImageUrl} alt='Gallery item' />
        </div>
      )}
      {!galleryImageUrl && <div className='gallery-item' />}
      {props.visibleTitle && (
        <div className='gallery-title'>
          {cardPage?.icon ? (
            <PageIcon isEditorEmpty={!cardPage?.hasContent} pageType='card' icon={cardPage.icon} />
          ) : undefined}
          <div key='__title'>
            {cardPage?.title || <FormattedMessage id='KanbanCard.untitled' defaultMessage='Untitled' />}
          </div>
        </div>
      )}
      {visiblePropertyTemplates.length > 0 && (
        <div className='gallery-props'>
          {visiblePropertyTemplates.map((template) => (
            <PropertyValueElement
              key={template.id}
              updatedAt={cardPage?.updatedAt.toString() || ''}
              updatedBy={cardPage?.updatedBy || ''}
              board={board}
              readOnly={true}
              card={card}
              propertyTemplate={template}
              showEmptyPlaceholder={false}
              showTooltip
              displayType='gallery'
            />
          ))}
        </div>
      )}
    </StyledBox>
  ) : null;
});

export default GalleryCard;
