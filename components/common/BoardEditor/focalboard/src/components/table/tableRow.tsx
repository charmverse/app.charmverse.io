import type { PageMeta } from '@charmverse/core/pages';
import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import CollapseIcon from '@mui/icons-material/ArrowDropDown';
import ExpandIcon from '@mui/icons-material/ArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box } from '@mui/material';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { mutate } from 'swr';

import { filterPropertyTemplates } from 'components/common/BoardEditor/utils/updateVisibilePropertyIds';
import { PageActionsMenu } from 'components/common/PageActions/components/PageActionsMenu';
import { PageIcon } from 'components/common/PageIcon';
import { RewardApplicationStatusIcon } from 'components/rewards/components/RewardApplicationStatusChip';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { REWARD_STATUS_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { isTouchScreen } from 'lib/utilities/browser';

import { TextInput } from '../../../../components/properties/TextInput';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import PropertyValueElement from '../propertyValueElement';

export type CardPageWithCustomIcon = CardPage & {
  customIcon?: ReactElement | null;
  subPages?: CardPageWithCustomIcon[];
};

type Props = {
  hasContent?: boolean;
  board: Board;
  activeView: BoardView;
  card: Card;
  pageIcon?: string | null;
  pageTitle: string;
  isSelected: boolean;
  focusOnMount: boolean;
  showCard: (cardId: string, parentId?: string) => void;
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
  isExpanded?: boolean | null;
  setIsExpanded?: (expanded: boolean) => void;
  indentTitle?: number;
  isNested?: boolean;
  expandSubRowsOnLoad?: boolean;
  subRowsEmptyValueContent?: ReactElement | string;
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
    indentTitle,
    isNested,
    subRowsEmptyValueContent
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
  const handleClick = (event: MouseEvent<HTMLElement>) => {
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
      style={{ opacity: isDragging ? 0.5 : 1, backgroundColor: isNested ? 'var(--input-bg)' : 'transparent' }}
    >
      {!props.readOnly && (
        <Box className='icons row-actions' onClick={handleClick}>
          <Box className='charm-drag-handle'>
            <DragIndicatorIcon color='secondary' />
          </Box>
        </Box>
      )}

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
              <div style={{ display: 'flex', width: '100%' }}>
                <div className='octo-icontitle' style={{ alignSelf: 'flex-start', alignItems: 'flex-start' }}>
                  {setIsExpanded &&
                    (isExpanded ? (
                      <CollapseIcon onClick={() => setIsExpanded(false)} />
                    ) : isExpanded === false ? (
                      <ExpandIcon onClick={() => setIsExpanded(true)} />
                    ) : (
                      <span style={{ paddingRight: '24px' }}></span>
                    ))}

                  {indentTitle && <div style={{ paddingRight: `${indentTitle}px` }}></div>}
                  {card.customIconType === 'applicationStatus' && card.fields.properties[REWARD_STATUS_BLOCK_ID] && (
                    <RewardApplicationStatusIcon
                      status={card.fields.properties[REWARD_STATUS_BLOCK_ID] as ApplicationStatus}
                    />
                  )}
                  {card.customIconType !== 'applicationStatus' && card.customIconType !== 'reward' && (
                    <PageIcon
                      isEditorEmpty={!hasContent}
                      pageType={card.customIconType === 'reward' ? 'bounty' : 'page'}
                      icon={pageIcon}
                    />
                  )}
                  <TextInput {...commonProps} multiline={wrapColumn} />
                </div>

                <div className='open-button' data-test={`database-open-button-${card.id}`}>
                  <Button onClick={() => props.showCard(props.card.id || '', props.card.parentId)}>
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
              subRowsEmptyValueContent={subRowsEmptyValueContent}
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

export function ExpandableTableRow(
  props: Omit<Props, 'isExpanded' | 'setIsExpanded'> & { isNested?: boolean; subPages?: CardPage[] }
) {
  const isExpandedOnRender = props.subPages?.length ? !!props.expandSubRowsOnLoad : null;
  const [isExpanded, setIsExpanded] = useState<boolean | null>(isExpandedOnRender);

  useEffect(() => {
    setIsExpanded((v) => {
      if (v === null && props.subPages?.length) {
        return !!props.expandSubRowsOnLoad;
      }

      return v;
    });
  }, [props.subPages?.length]);

  return (
    <>
      <TableRow
        {...props}
        subRowsEmptyValueContent={props.isNested ? props.subRowsEmptyValueContent : undefined}
        isExpanded={isExpanded}
        setIsExpanded={props.subPages ? setIsExpanded : undefined}
      />
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
            indentTitle={30}
            isNested
            subRowsEmptyValueContent={props.subRowsEmptyValueContent}
          />
        ))}
    </>
  );
}

export default memo(ExpandableTableRow);
