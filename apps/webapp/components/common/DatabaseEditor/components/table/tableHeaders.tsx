import { useTheme } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import { Box, Menu } from '@mui/material';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView, ISortOption } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import { OctoUtils } from '@packages/databases/octoUtils';
import { Utils } from '@packages/databases/utils';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, SetStateAction } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useSyncRelationProperty } from 'charmClient/hooks/blocks';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useViewSortOptions } from 'hooks/useViewSortOptions';

import { filterPropertyTemplates } from '../../utils/updateVisibilePropertyIds';
import Button from '../../widgets/buttons/button';
import { PropertyTypes } from '../../widgets/propertyTypes';
import { typeDisplayName } from '../../widgets/typeDisplayName';

import TableHeader from './tableHeader';
import { StyledCheckbox } from './tableRow';

type Props = {
  board: Board;
  cards: Card[];
  activeView: BoardView;
  views: BoardView[];
  readOnly: boolean;
  resizingColumn: string;
  offset: number;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
  setSelectedPropertyId?: Dispatch<SetStateAction<string | null>>;
  boardType?: 'proposals' | 'rewards';
};

function TableHeaders(props: Props): JSX.Element {
  const {
    board,
    cards,
    activeView,
    resizingColumn,
    views,
    offset,
    columnRefs,
    setCheckedIds,
    readOnly,
    checkedIds = []
  } = props;
  const intl = useIntl();
  const { formatDateTime, formatDate } = useDateFormatter();
  const addPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-property' });
  const { trigger: syncRelationProperty } = useSyncRelationProperty();

  const isSmallScreen = useSmallScreen();
  const theme = useTheme();
  const sortOptions = useViewSortOptions(activeView);
  const onAutoSizeColumn = useCallback(
    (columnID: string, headerWidth: number) => {
      let longestSize = headerWidth;
      const visibleProperties =
        board.fields.cardProperties.filter(() => activeView.fields.visiblePropertyIds.includes(columnID)) || [];
      const columnRef = columnRefs.get(columnID);
      if (!columnRef?.current) {
        return;
      }

      let template: IPropertyTemplate | undefined;
      const columnFontPadding = Utils.getFontAndPaddingFromCell(columnRef.current);
      let perItemPadding = 0;
      if (columnID !== Constants.titleColumnId) {
        template = visibleProperties.find((t: IPropertyTemplate) => t.id === columnID);
        if (!template) {
          return;
        }
        if (template.type === 'multiSelect') {
          // For multiselect, the padding calculated above depends on the number selected when calculating the padding.
          // Need to calculate it manually here.
          // DOM Object hierarchy should be {cell -> property -> [value1, value2, etc]}
          let valueCount = 0;
          if (columnRef?.current?.childElementCount > 0) {
            const propertyElement = columnRef.current.children.item(0) as Element;
            if (propertyElement) {
              valueCount = propertyElement.childElementCount;
              if (valueCount > 0) {
                const statusPadding = Utils.getFontAndPaddingFromChildren(propertyElement.children, 0);
                perItemPadding = statusPadding.padding / valueCount;
              }
            }
          }

          // remove the "value" portion of the original calculation
          columnFontPadding.padding -= perItemPadding * valueCount;
        }
      }

      cards.forEach((card) => {
        let thisLen = 0;
        if (columnID === Constants.titleColumnId) {
          thisLen = Utils.getTextWidth(card.title, columnFontPadding.fontDescriptor) + columnFontPadding.padding;
        } else if (template) {
          const displayValue =
            OctoUtils.propertyDisplayValue({
              block: card,
              propertyValue: card.fields.properties[columnID],
              propertyTemplate: template as IPropertyTemplate,
              formatters: {
                date: formatDate,
                dateTime: formatDateTime
              }
            }) || '';
          switch (template.type) {
            case 'select': {
              thisLen = Utils.getTextWidth(displayValue.toString().toUpperCase(), columnFontPadding.fontDescriptor);
              break;
            }
            case 'multiSelect': {
              if (displayValue) {
                const displayValues = displayValue as string[];
                displayValues.forEach((value) => {
                  thisLen += Utils.getTextWidth(value.toUpperCase(), columnFontPadding.fontDescriptor) + perItemPadding;
                });
              }
              break;
            }
            default: {
              thisLen = Utils.getTextWidth(displayValue.toString(), columnFontPadding.fontDescriptor);
              break;
            }
          }
          thisLen += columnFontPadding.padding;
        }
        if (thisLen > longestSize) {
          longestSize = thisLen;
        }
      });

      const columnWidths = { ...activeView.fields.columnWidths };
      columnWidths[columnID] = longestSize;
      const newView = createBoardView(activeView);
      newView.fields.columnWidths = columnWidths;
      mutator.updateBlock(newView, activeView, 'autosize column');
    },
    [activeView, board, cards]
  );

  const visiblePropertyTemplates = useMemo(() => {
    return filterPropertyTemplates(activeView.fields.visiblePropertyIds, board.fields.cardProperties);
  }, [board.fields.cardProperties, activeView.fields.visiblePropertyIds]);

  const onDropToColumn = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    Utils.log(`ondrop. Source column: ${sourceProperty.name}, dest column: ${destinationProperty.name}`);
    // Move template to new index
    let visiblePropertyIds = activeView.fields.visiblePropertyIds;
    visiblePropertyIds = visiblePropertyIds.includes(Constants.titleColumnId)
      ? visiblePropertyIds
      : [Constants.titleColumnId, ...visiblePropertyIds];
    const destIndex = visiblePropertyIds.indexOf(destinationProperty.id);

    await mutator.changeViewVisiblePropertiesOrder(
      activeView.id,
      visiblePropertyIds,
      sourceProperty,
      destIndex >= 0 ? destIndex : 0
    );
  };

  const propertyTypes = useMemo(
    () =>
      activeView && (
        <PropertyTypes
          boardType={props.boardType}
          isMobile={isSmallScreen}
          onClick={async ({ type, relationData, name }) => {
            addPropertyPopupState.close();
            const template: IPropertyTemplate = {
              id: Utils.createGuid(),
              name: name ?? typeDisplayName(intl, type),
              type,
              options: [],
              relationData
            };
            await mutator.insertPropertyTemplate(board, activeView, -1, template);
            if (relationData?.showOnRelatedBoard) {
              syncRelationProperty({
                boardId: board.id,
                templateId: template.id
              });
            }
          }}
        />
      ),
    [mutator, props.boardType, board, activeView, isSmallScreen]
  );

  return (
    <div className='octo-table-header TableHeaders' id='mainBoardHeader'>
      {setCheckedIds && !readOnly && cards.length !== 0 && (
        <StyledCheckbox
          checked={checkedIds.length === cards.length}
          className='disable-drag-selection'
          onChange={() => {
            if (checkedIds.length === cards.length) {
              setCheckedIds([]);
            } else {
              setCheckedIds(cards.map((card) => card.id));
            }
          }}
          icon={
            checkedIds.length === cards.length ? (
              <CheckBoxOutlinedIcon fontSize='small' />
            ) : checkedIds.length === 0 ? (
              <CheckBoxOutlineBlankOutlinedIcon fontSize='small' />
            ) : (
              <IndeterminateCheckBoxOutlinedIcon fontSize='small' />
            )
          }
          show={checkedIds.length !== 0}
          size='small'
          disableFocusRipple
          disableRipple
          disableTouchRipple
          sx={{
            alignSelf: 'center'
          }}
        />
      )}

      {visiblePropertyTemplates.map((template) => {
        let sorted: 'up' | 'down' | 'none' = 'none';
        const sortOption = sortOptions.find((o: ISortOption) => o.propertyId === template.id);
        if (sortOption) {
          sorted = sortOption.reversed ? 'down' : 'up';
        }
        return (
          <TableHeader
            sorted={sorted}
            readOnly={props.readOnly}
            board={board}
            activeView={activeView}
            cards={cards}
            views={views}
            template={template}
            key={template.id}
            offset={resizingColumn === template.id ? offset : 0}
            onDrop={onDropToColumn}
            onAutoSizeColumn={onAutoSizeColumn}
            setSelectedPropertyId={props.setSelectedPropertyId}
          />
        );
      })}
      {/* empty column for actions */}
      <div
        className='octo-table-cell header-cell disable-drag-selection'
        style={{ flexGrow: 1, borderRight: '0 none' }}
      >
        {!props.readOnly && (
          <>
            <Button {...bindTrigger(addPropertyPopupState)}>
              <AddIcon data-test='add-table-prop' fontSize='small' />
            </Button>
            {isSmallScreen ? (
              <MobileDialog
                title={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
                open={addPropertyPopupState.isOpen}
                onClose={() => addPropertyPopupState.close()}
                PaperProps={{ sx: { background: theme.palette.background.light } }}
                contentSx={{ pr: 0, pb: 0, pl: 1 }}
              >
                <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
                  {propertyTypes}
                </Box>
              </MobileDialog>
            ) : (
              <Menu
                {...bindMenu(addPropertyPopupState)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
              >
                {propertyTypes}
              </Menu>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TableHeaders;
