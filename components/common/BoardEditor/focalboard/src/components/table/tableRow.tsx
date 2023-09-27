import type { PageMeta } from '@charmverse/core/pages';
import CollapseIcon from '@mui/icons-material/ArrowDropDown';
import ExpandIcon from '@mui/icons-material/ArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { IconButton, Box } from '@mui/material';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';

import { filterPropertyTemplates } from 'components/common/BoardEditor/utils/updateVisibilePropertyIds';
import { PageActionsMenu } from 'components/common/PageActions/components/PageActionsMenu';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { isTouchScreen } from 'lib/utilities/browser';

import { TextInput } from '../../../../components/properties/TextInput';
import { Constants } from '../../constants';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  hasContent?: boolean;
  board: Board;
  activeView: BoardView;
  card: Card;
  pageIcon?: string | null;
  pageTitle: string;
  isSelected: boolean;
  focusOnMount: boolean;
  showCard: (cardId: string) => void;
  readOnly: boolean;
  offset: number;
  pageUpdatedAt: string;
  pageUpdatedBy: string;
  resizingColumn: string;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  onClick?: (e: React.MouseEvent<HTMLDivElement>, card: Card) => void;
  onDeleteCard?: (cardId: string) => Promise<void>;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  saveTitle: (saveType: string, cardId: string, title: string, oldTitle: string) => void;
  cardPage: PageMeta;
  readOnlyTitle?: boolean;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  indentTitle?: number;
};

export const columnWidth = (
  resizingColumn: string,
  columnWidths: Record<string, number>,
  offset: number,
  templateId: string
): number => {
  if (resizingColumn === templateId) {
    return Math.max(Constants.minColumnWidth, (columnWidths[templateId] || 0) + offset);
  }
  return Math.max(Constants.minColumnWidth, columnWidths[templateId] || 0);
};

function TableRow(props: Props) {
  const {
    cardPage,
    hasContent,
    board,
    activeView,
    columnRefs,
    card,
    pageIcon,
    pageTitle,
    pageUpdatedAt,
    pageUpdatedBy,
    saveTitle,
    onDeleteCard,
    setIsExpanded,
    isExpanded,
    indentTitle
  } = props;
  const { space } = useCurrentSpace();
  const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null);
  const [title, setTitle] = useState('');
  const isManualSort = activeView.fields.sortOptions.length === 0;
  const isGrouped = Boolean(activeView.fields.groupById);
  const [isDragging, isOver, cardRef] = useSortable(
    'card',
    card,
    !isTouchScreen() && !props.readOnly && (isManualSort || isGrouped),
    props.onDrop
  );
  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure();
      return;
    }
    if (onDeleteCard) {
      await onDeleteCard(card.id);
    } else {
      await mutator.deleteBlock(card, 'delete card');
    }
    mutate(`pages/${space?.id}`);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  useEffect(() => {
    if (props.focusOnMount) {
      setTimeout(() => titleRef.current?.focus(), 10);
    }
  }, []);

  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle]);

  const visiblePropertyTemplates = useMemo(() => {
    return filterPropertyTemplates(activeView.fields.visiblePropertyIds, board.fields.cardProperties);
  }, [board.fields.cardProperties, activeView.fields.visiblePropertyIds]);

  let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row';
  if (isOver) {
    className += ' dragover';
  }
  if (isGrouped) {
    const groupID = activeView.fields.groupById || '';
    const groupValue = (card.fields.properties[groupID] as string) || 'undefined';
    if (activeView.fields.collapsedOptionIds.indexOf(groupValue) > -1) {
      className += ' hidden';
    }
  }

  const wrapColumn = activeView.fields.columnWrappedIds?.includes(Constants.titleColumnId);
  const commonProps = {
    ref: titleRef,
    value: title,
    placeholderText: 'Untitled',
    onChange: (newTitle: string) => setTitle(newTitle),
    onSave: (saveType: string) => saveTitle(saveType, card.id, title, pageTitle),
    onCancel: () => setTitle(card.title || ''),
    readOnly: props.readOnly || props.readOnlyTitle,
    spellCheck: true
  };
  return (
    <div
      data-test={`database-row-${card.id}`}
      className={className}
      onClick={(e) => props.onClick?.(e, card)}
      ref={cardRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Columns, one per property */}
      {visiblePropertyTemplates.map((template, templateIndex) => {
        if (template.id === Constants.titleColumnId) {
          return (
            <Box
              className='octo-table-cell title-cell'
              sx={{
                width: columnWidth(
                  props.resizingColumn,
                  props.activeView.fields.columnWidths,
                  props.offset,
                  Constants.titleColumnId
                )
              }}
              ref={columnRefs.get(Constants.titleColumnId)}
              key={template.id}
              onPaste={(e) => e.stopPropagation()}
            >
              {!props.readOnly && templateIndex === 0 && (
                <IconButton className='icons' onClick={handleClick} size='small'>
                  <DragIndicatorIcon color='secondary' />
                </IconButton>
              )}
              <div style={{ display: 'flex', width: '100%' }}>
                <div className='octo-icontitle' style={{ alignSelf: 'flex-start', alignItems: 'flex-start' }}>
                  {setIsExpanded &&
                    (isExpanded ? (
                      <CollapseIcon onClick={() => setIsExpanded(false)} />
                    ) : (
                      <ExpandIcon onClick={() => setIsExpanded(true)} />
                    ))}
                  {indentTitle && <div style={{ paddingRight: `${indentTitle}px` }}></div>}
                  <PageIcon isEditorEmpty={!hasContent} pageType='page' icon={pageIcon} />
                  <TextInput {...commonProps} multiline={wrapColumn} />
                </div>

                <div className='open-button' data-test={`database-row-open-${card.id}`}>
                  <Button onClick={() => props.showCard(props.card.id || '')}>
                    <FormattedMessage id='TableRow.open' defaultMessage='Open' />
                  </Button>
                </div>
              </div>
            </Box>
          );
        }

        const columnRef = columnRefs.get(template.id);

        return (
          <div
            className='octo-table-cell'
            key={template.id}
            style={{
              alignItems: 'flex-start',
              width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id),
              overflowX: 'hidden'
            }}
            ref={columnRef}
            onPaste={(e) => e.stopPropagation()}
          >
            {!props.readOnly && templateIndex === 0 && (
              <IconButton className='icons' onClick={handleClick} size='small'>
                <DragIndicatorIcon color='secondary' />
              </IconButton>
            )}
            <PropertyValueElement
              readOnly={props.readOnly}
              syncWithPageId={cardPage?.syncWithPageId}
              card={card}
              board={board}
              showEmptyPlaceholder={false}
              propertyTemplate={template}
              updatedAt={pageUpdatedAt}
              updatedBy={pageUpdatedBy}
              displayType='table'
              columnRef={columnRef}
              wrapColumn={activeView.fields.columnWrappedIds?.includes(template.id)}
            />
          </div>
        );
      })}
      {!props.readOnly && (
        <PageActionsMenu
          onClickDelete={handleDeleteCard}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          page={cardPage}
        />
      )}
      {/* empty column for actions on header row */}
      <div className='octo-table-cell' style={{ flexGrow: 1, borderRight: '0 none' }}></div>
    </div>
  );
}

export function ExpandableTableRow(props: Omit<Props, 'isExpanded' | 'setIsExpanded'> & { subPages?: CardPage[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <TableRow {...props} isExpanded={isExpanded} setIsExpanded={props.subPages?.length ? setIsExpanded : undefined} />
      {isExpanded &&
        props.subPages?.map((subPage) => (
          <ExpandableTableRow
            key={subPage.card.id}
            {...props}
            pageTitle={subPage.page.title}
            pageUpdatedAt={subPage.page.updatedAt.toISOString()}
            card={subPage.card}
            cardPage={subPage.page}
            subPages={subPage.subPages}
            indentTitle={22}
          />
        ))}
    </>
  );
}

export default memo(ExpandableTableRow);
