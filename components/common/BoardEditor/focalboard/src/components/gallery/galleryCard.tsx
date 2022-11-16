import DuplicateIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { mutate } from 'swr';

import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { isTouchScreen } from 'lib/utilities/browser';

import type { Board, IPropertyTemplate } from '../../blocks/board';
import type { Card } from '../../blocks/card';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import IconButton from '../../widgets/buttons/iconButton';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import Tooltip from '../../widgets/tooltip';
import PropertyValueElement from '../propertyValueElement';

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
  const intl = useIntl();
  const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readOnly && !isTouchScreen(), props.onDrop);

  const cardPage = pages[card.id];

  const visiblePropertyTemplates = props.visiblePropertyTemplates || [];

  let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard';
  if (isOver) {
    className += ' dragover';
  }

  const galleryImageUrl: null | string | undefined = cardPage?.headerImage || cardPage?.galleryImage;

  const { showMessage } = useSnackbar();

  const pagePermissions = getPagePermissions(card.id);

  return (
    <div
      className={className}
      onClick={(e: React.MouseEvent) => props.onClick(e, card)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      ref={cardRef}
    >
      {!props.readOnly
        && (
          <MenuWrapper
            className='optionsMenu'
            stopPropagationOnToggle={true}
          >
            <IconButton icon={<MoreHorizIcon />} />
            <Menu position='left'>
              {pagePermissions.delete && pages[card.id]?.deletedAt === null && (
                <Menu.Text
                  icon={<DeleteOutlineIcon />}
                  id='delete'
                  name={intl.formatMessage({ id: 'GalleryCard.delete', defaultMessage: 'Delete' })}
                  onClick={() => mutator.deleteBlock(card, 'delete card')}
                />
              )}
              <Menu.Text
                icon={<DuplicateIcon />}
                id='duplicate'
                name={intl.formatMessage({ id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate' })}
                onClick={() => {
                  if (pages[card.id] && space) {
                    mutator.duplicateCard({
                      cardId: card.id,
                      board,
                      cardPage: pages[card.id]!,
                      afterRedo: async () => {
                        mutate(`pages/${space.id}`);
                      }
                    });
                  }
                }}
              />
              <Menu.Text
                icon={<LinkIcon />}
                id='copy'
                name={intl.formatMessage({ id: 'GalleryCard.copyLink', defaultMessage: 'Copy link' })}
                onClick={() => {
                  let cardLink = window.location.href;

                  const queryString = new URLSearchParams(window.location.search);
                  if (queryString.get('cardId') !== card.id) {
                    const newUrl = new URL(window.location.toString());
                    newUrl.searchParams.set('cardId', card.id);
                    cardLink = newUrl.toString();
                  }

                  Utils.copyTextToClipboard(cardLink);
                  showMessage('Copied card link to clipboard', 'success');
                }}
              />
            </Menu>
          </MenuWrapper>
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
    </div>
  );
});

export default GalleryCard;

