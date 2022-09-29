import React from 'react';

import { Typography } from '@mui/material';
import { Board, IPropertyTemplate, PropertyType } from '../../blocks/board';
import { Constants } from '../../constants';
import { Card } from '../../blocks/card';
import { BoardView } from '../../blocks/boardView';
import SortDownIcon from '../../widgets/icons/sortDown';
import SortUpIcon from '../../widgets/icons/sortUp';
import MenuWrapper from '../../widgets/menuWrapper';
import Label from '../../widgets/label';
import { useSortable } from '../../hooks/sortable';
import { Utils } from '../../utils';

import HorizontalGrip from './horizontalGrip';

import TableHeaderMenu from './tableHeaderMenu';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

type Props = {
    readOnly: boolean
    sorted: 'up'|'down'|'none'
    name: React.ReactNode
    board: Board
    activeView: BoardView
    cards: Card[]
    views: BoardView[]
    template: IPropertyTemplate
    offset: number
    type: PropertyType
    onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void
    onAutoSizeColumn: (columnID: string, headerWidth: number) => void
}

function TableHeader (props: Props): JSX.Element {
  const [isDragging, isOver, columnRef] = useSortable('column', props.template, !props.readOnly, props.onDrop);
  const columnWidth = (templateId: string): number => {
    return Math.max(Constants.minColumnWidth, (props.activeView.fields.columnWidths[templateId] || 0) + props.offset);
  };

  const onAutoSizeColumn = React.useCallback((templateId: string) => {
    let width = Constants.minColumnWidth;
    if (columnRef.current) {
      const { fontDescriptor, padding } = Utils.getFontAndPaddingFromCell(columnRef.current);
      const textWidth = Utils.getTextWidth(columnRef.current.innerText.toUpperCase(), fontDescriptor);
      width = textWidth + padding;
    }
    props.onAutoSizeColumn(templateId, width);
  }, []);

  let className = 'octo-table-cell header-cell';
  if (isOver) {
    className += ' dragover';
  }

  return (
    <div
      className={className}
      style={{ overflow: 'unset', width: columnWidth(props.template.id), opacity: isDragging ? 0.5 : 1 }}
      ref={props.template.id === Constants.titleColumnId ? () => null : columnRef}
    >
      <MenuWrapper disabled={props.readOnly}>
        <Label>
          <div style={{ marginRight: 4, display: 'flex' }}>{iconForPropertyType(props.type, {
            sx: {
              width: 18,
              height: 18
            }
          })}
          </div>
          <Typography component='div' variant='subtitle1'>{props.name}</Typography>
          {props.sorted === 'up' && <SortUpIcon />}
          {props.sorted === 'down' && <SortDownIcon />}
        </Label>
        <TableHeaderMenu
          board={props.board}
          activeView={props.activeView}
          views={props.views}
          cards={props.cards}
          templateId={props.template.id}
        />
      </MenuWrapper>

      <div className='octo-spacer' />

      {!props.readOnly
                && (
                <HorizontalGrip
                  templateId={props.template.id}
                  onAutoSizeColumn={onAutoSizeColumn}
                />
                )}
    </div>
  );
}

export default React.memo(TableHeader);
