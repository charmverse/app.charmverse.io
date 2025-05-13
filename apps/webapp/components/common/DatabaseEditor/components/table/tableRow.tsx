import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import CollapseIcon from '@mui/icons-material/ArrowDropDown';
import ExpandIcon from '@mui/icons-material/ArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Checkbox, Stack } from '@mui/material';
import type { Dispatch, MouseEvent, ReactElement, ReactNode, SetStateAction } from 'react';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useTrashPages } from 'charmClient/hooks/pages';
import Link from 'components/common/Link';
import { DatabaseRowActionsMenu } from 'components/common/PageActions/components/DatabaseRowActionsMenu';
import { PageIcon } from 'components/common/PageIcon';
import { RewardApplicationStatusIcon } from 'components/rewards/components/RewardApplicationStatusChip';
import { useDragDrop } from 'hooks/useDragDrop';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card, CardWithRelations } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import { APPLICANT_STATUS_BLOCK_ID, REWARD_STATUS_BLOCK_ID } from '@packages/lib/rewards/blocks/constants';
import { isTouchScreen } from '@packages/lib/utils/browser';
import { mergeRefs } from '@packages/lib/utils/react';

import { Utils } from '../../utils';
import { filterPropertyTemplates } from '../../utils/updateVisibilePropertyIds';
import Button from '../../widgets/buttons/button';
import { TextInput } from '../properties/TextInput';
import PropertyValueElement from '../propertyValueElement';

export type CardPageWithCustomIcon = Card & {
  customIcon?: ReactElement | null;
  subPages?: CardPageWithCustomIcon[];
};

type Props = {
  hasContent?: boolean;
  board: Board;
  activeView: BoardView;
  card: CardWithRelations;
  pageIcon?: string | null;
  pageTitle: string;
  isSelected: boolean;
  focusOnMount: boolean;
  showCard: (cardId: string, parentId?: string, event?: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => void;
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
  readOnlyTitle?: boolean;
  isExpandedGroup?: boolean;
  isExpanded?: boolean | null;
  setIsExpanded?: (option: { expanded: boolean; cardId: string }) => void;
  indentTitle?: number;
  isNested?: boolean;
  expandSubRowsOnLoad?: boolean;
  subRowsEmptyValueContent?: ReactElement | string;
  emptySubPagesPlaceholder?: ReactNode;
  isChecked?: boolean;
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
  disableDragAndDrop?: boolean;
};

export const StyledCheckbox = styled(Checkbox, {
  shouldForwardProp(propName) {
    return propName !== 'show';
  }
})<{ show?: boolean }>`
  ${({ show }) => (!show ? `opacity: 0;` : '')}
  transition: opacity 250ms ease-in-out;

  &:hover {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }

  padding: 0;
  height: fit-content;
  margin-left: ${({ theme }) => theme.spacing(0.5)};
`;

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
  const cardRef = useRef<HTMLDivElement>(null);
  const {
    card,
    hasContent,
    board,
    activeView,
    columnRefs,
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
    subRowsEmptyValueContent,
    isChecked,
    setCheckedIds
  } = props;
  const { showError } = useSnackbar();
  const { trigger: trashPages } = useTrashPages();
  const isMobile = useSmallScreen();
  const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null);
  const [title, setTitle] = useState('');
  const isGrouped = Boolean(activeView.fields.groupById);
  const isDragAndDropEnabled = !isTouchScreen() && !props.readOnly && !props.disableDragAndDrop;

  const href =
    card.customIconType === 'applicationStatus' ? `/rewards/applications/${card.id}` : `/${card.pageId || card.id}`;

  const { drag, drop, preview, style } = useDragDrop({
    item: card,
    itemType: 'card',
    onDrop: props.onDrop,
    enabled: isDragAndDropEnabled
  });

  const handleDeleteCard = async () => {
    if (!card) {
      Utils.assertFailure();
      return;
    }
    try {
      if (onDeleteCard) {
        await onDeleteCard(card.id);
      } else {
        await trashPages({ pageIds: [card.id], trash: true });
      }
    } catch (error) {
      showError(error);
    }
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

  // TODO: Detect highlighted rows from the code which manages the selection, instead of each row individually
  // useEffect(() => {
  //   if (setCheckedIds && selection) {
  //     setCheckedIds((checkedIds) => {
  //       if (isSelected && !checkedIds.includes(card.id)) {
  //         return Array.from(new Set([...checkedIds, card.id]));
  //       } else if (!isSelected && checkedIds.includes(card.id)) {
  //         return checkedIds.filter((checkedId) => checkedId !== card.id);
  //       }

  //       return checkedIds;
  //     });
  //   }
  // }, [isSelected, !!selection]);

  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle]);

  const visiblePropertyTemplates = useMemo(() => {
    return filterPropertyTemplates(activeView.fields.visiblePropertyIds, board.fields.cardProperties);
  }, [board.fields.cardProperties, activeView.fields.visiblePropertyIds]);

  let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row';

  if (isGrouped && !props.isExpandedGroup) {
    className += ' hidden';
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
      ref={mergeRefs([cardRef, preview, drop])}
      style={{
        backgroundColor:
          // isSelected || isChecked ? 'rgba(35, 131, 226, 0.14)' : isNested ? 'var(--input-bg)' : 'transparent',
          isChecked ? 'rgba(35, 131, 226, 0.14)' : isNested ? 'var(--input-bg)' : 'transparent',
        zIndex: 85,
        ...style
      }}
    >
      {!props.readOnly && (
        <Stack flexDirection='row' gap={1} alignItems='center'>
          {!isNested && isDragAndDropEnabled && (
            <div
              className='icons row-actions'
              onClick={handleClick}
              ref={drag as any}
              style={{
                padding: 0
              }}
            >
              <Box className='charm-drag-handle disable-drag-selection'>
                <DragIndicatorIcon color='secondary' />
              </Box>
            </div>
          )}
          {isNested ? (
            <div style={{ marginLeft: 24 }} />
          ) : setCheckedIds ? (
            <StyledCheckbox
              className='table-row-checkbox disable-drag-selection'
              checked={isChecked}
              show={isChecked}
              onChange={() => {
                setCheckedIds((checkedIds) => {
                  if (!isChecked) {
                    return Array.from(new Set([...checkedIds, card.id]));
                  }

                  return checkedIds.filter((checkedId) => checkedId !== card.id);
                });
              }}
              size='small'
              disableFocusRipple
              disableRipple
              disableTouchRipple
            />
          ) : null}
        </Stack>
      )}

      {/* Columns, one per property */}
      {visiblePropertyTemplates.map((template) => {
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
                      <CollapseIcon
                        onClick={() =>
                          setIsExpanded({
                            cardId: card.id,
                            expanded: false
                          })
                        }
                      />
                    ) : isExpanded === false ? (
                      <ExpandIcon
                        onClick={() =>
                          setIsExpanded({
                            cardId: card.id,
                            expanded: true
                          })
                        }
                      />
                    ) : (
                      <span style={{ paddingRight: '24px' }}></span>
                    ))}

                  {indentTitle && <div style={{ paddingRight: `${indentTitle}px` }}></div>}
                  {card.customIconType === 'applicationStatus' &&
                    (card.fields.properties[REWARD_STATUS_BLOCK_ID] ||
                      card.fields.properties[APPLICANT_STATUS_BLOCK_ID]) && (
                      <RewardApplicationStatusIcon
                        status={
                          (card.fields.properties[REWARD_STATUS_BLOCK_ID] ||
                            card.fields.properties[APPLICANT_STATUS_BLOCK_ID]) as ApplicationStatus
                        }
                      />
                    )}
                  {card.customIconType !== 'applicationStatus' && card.customIconType !== 'reward' && (
                    <PageIcon
                      isStructuredProposal={card.isStructuredProposal}
                      isEditorEmpty={!hasContent}
                      pageType={card.customIconType === 'reward' ? 'bounty' : 'page'}
                      icon={pageIcon}
                    />
                  )}
                  <TextInput {...commonProps} disablePopup={isMobile} multiline={wrapColumn} />
                </div>

                <div className='open-button'>
                  <Link
                    data-test={`database-open-button-${card.id}`}
                    href={href}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <Button onClick={(e) => props.showCard(card.id || '', card.parentId, e)}>
                      <FormattedMessage id='TableRow.open' defaultMessage='Open' />
                    </Button>
                  </Link>
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
            data-test={`database-card-${card.id}-column-${template.id}`}
            ref={columnRef}
            onPaste={(e) => e.stopPropagation()}
          >
            <PropertyValueElement
              showCard={(cardId) => cardId && props.showCard(cardId)}
              readOnly={props.readOnly || Boolean(isNested)}
              card={card}
              board={board}
              showEmptyPlaceholder={false}
              propertyTemplate={template}
              updatedAt={pageUpdatedAt}
              updatedBy={pageUpdatedBy}
              displayType='table'
              columnRef={columnRef}
              wrapColumn={activeView.fields.columnWrappedIds?.includes(template.id)}
              // Show this component as the empty values of the subrows, to make it distinct from the empty values of the main row
              subRowsEmptyValueContent={subRowsEmptyValueContent}
            />
          </div>
        );
      })}
      {!props.readOnly && (
        <DatabaseRowActionsMenu
          onClickDelete={handleDeleteCard}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          page={card}
        />
      )}
      {/* empty column for actions on header row */}
      <div className='octo-table-cell' style={{ flexGrow: 1, borderRight: '0 none' }}></div>
    </div>
  );
}

function ExpandableTableRow({ subPages, ...props }: Props & { isNested?: boolean; subPages?: Card[] }) {
  const isGrouped = Boolean(props.activeView.fields.groupById);
  return (
    <>
      <TableRow
        {...props}
        subRowsEmptyValueContent={props.isNested ? props.subRowsEmptyValueContent : undefined}
        isExpanded={props.isExpanded}
        isExpandedGroup={props.isExpandedGroup}
        setIsExpanded={subPages ? props.setIsExpanded : undefined}
      />
      {props.isExpanded &&
        (!isGrouped || props.isExpandedGroup === true) &&
        (!subPages || subPages?.length === 0
          ? props.emptySubPagesPlaceholder
          : subPages?.map((subPage) => (
              <ExpandableTableRow
                key={subPage.id}
                {...props}
                pageTitle={subPage.title}
                pageUpdatedAt={new Date(subPage.updatedAt).toISOString()}
                card={subPage}
                indentTitle={30}
                isNested
                // Don't allow subrows to be selected
                setCheckedIds={undefined}
                subRowsEmptyValueContent={props.subRowsEmptyValueContent}
              />
            )))}
    </>
  );
}

export default memo(ExpandableTableRow);
