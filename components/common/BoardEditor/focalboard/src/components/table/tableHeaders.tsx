import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import React, { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { IPropertyTemplate, Board } from '../../blocks/board';
import type { BoardView, ISortOption } from '../../blocks/boardView';
import { createBoardView } from '../../blocks/boardView';
import type { Card } from '../../blocks/card';
import { Constants } from '../../constants';
import mutator from '../../mutator';
import { OctoUtils } from '../../octoUtils';
import { IDType, Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import PropertyMenu, { PropertyTypes, typeDisplayName } from '../../widgets/propertyMenu';

import TableHeader from './tableHeader';

type Props = {
    board: Board;
    cards: Card[];
    activeView: BoardView;
    views: BoardView[];
    readOnly: boolean;
    resizingColumn: string;
    offset: number;
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
}

function TableHeaders (props: Props): JSX.Element {
  const { board, cards, activeView, resizingColumn, views, offset, columnRefs } = props;
  const intl = useIntl();

  const onAutoSizeColumn = useCallback((columnID: string, headerWidth: number) => {
    let longestSize = headerWidth;
    const visibleProperties = board.fields.cardProperties.filter(() => activeView.fields.visiblePropertyIds.includes(columnID)) || [];
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
        columnFontPadding.padding -= (perItemPadding * valueCount);
      }
    }

    cards.forEach((card) => {
      let thisLen = 0;
      if (columnID === Constants.titleColumnId) {
        thisLen = Utils.getTextWidth(card.title, columnFontPadding.fontDescriptor) + columnFontPadding.padding;
      }
      else if (template) {
        const displayValue = (OctoUtils.propertyDisplayValue(card, card.fields.properties[columnID], template as IPropertyTemplate, intl) || '');
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
  }, [activeView, board, cards]);

  const visiblePropertyTemplates = useMemo(() => (
        activeView.fields.visiblePropertyIds.map((id) => board.fields.cardProperties.find((t) => t.id === id)).filter((i) => i) as IPropertyTemplate[]
  ), [board.fields.cardProperties, activeView.fields.visiblePropertyIds]);

  const onDropToColumn = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    Utils.log(`ondrop. Source column: ${sourceProperty.name}, dest column: ${destinationProperty.name}`);
    // Move template to new index
    const destIndex = destinationProperty ? activeView.fields.visiblePropertyIds.indexOf(destinationProperty.id) : 0;
    await mutator.changeViewVisiblePropertiesOrder(activeView, sourceProperty, destIndex >= 0 ? destIndex : 0);
  };

  const titleSortOption = activeView.fields.sortOptions?.find((o) => o.propertyId === Constants.titleColumnId);
  let titleSorted: 'up' | 'down' | 'none' = 'none';
  if (titleSortOption) {
    titleSorted = titleSortOption.reversed ? 'down' : 'up';
  }

  return (
    <div
      className='octo-table-header TableHeaders'
      id='mainBoardHeader'
    >
      <TableHeader
        type='text'
        name='Title'
        sorted={titleSorted}
        readOnly={props.readOnly}
        board={board}
        activeView={activeView}
        cards={cards}
        views={views}
        template={{ id: Constants.titleColumnId, name: 'title', type: 'text', options: [] }}
        offset={resizingColumn === Constants.titleColumnId ? offset : 0}
        onDrop={onDropToColumn}
        onAutoSizeColumn={onAutoSizeColumn}
      />

      {/* Table header row */}
      {visiblePropertyTemplates.map((template) => {
        let sorted: 'up' | 'down' | 'none' = 'none';
        const sortOption = activeView.fields.sortOptions.find((o: ISortOption) => o.propertyId === template.id);
        if (sortOption) {
          sorted = sortOption.reversed ? 'down' : 'up';
        }
        return (
          <TableHeader
            type={template.type}
            name={template.name}
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
          />
        );
      })}
      {/* empty column for actions */}
      <div
        className='octo-table-cell header-cell'
        style={{ flexGrow: 1, borderRight: '0 none' }}
      >

        {!props.readOnly
                    && (
                      <MenuWrapper>
                        <Button>
                          <AddIcon fontSize='small' />
                        </Button>
                        <Menu>
                          <PropertyTypes
                            label={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
                            onTypeSelected={async (type) => {
                              const template: IPropertyTemplate = {
                                id: Utils.createGuid(IDType.BlockID),
                                name: typeDisplayName(intl, type),
                                type,
                                options: []
                              };
                              const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template);
                            // setNewTemplateId(templateId)
                            }}
                          />
                        </Menu>
                      </MenuWrapper>
                    )}
      </div>
    </div>
  );
}

export default TableHeaders;
