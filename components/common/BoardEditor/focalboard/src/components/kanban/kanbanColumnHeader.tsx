/* eslint-disable max-lines */
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import type { Card } from '../../blocks/card';
import { Constants } from '../../constants';
import mutator from '../../mutator';
import IconButton from '../../widgets/buttons/iconButton';
import Editable from '../../widgets/editable';
import Label from '../../widgets/label';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';

import { KanbanCalculation } from './calculation/calculation';

type Props = {
  board: Board;
  activeView: BoardView;
  group: BoardGroup;
  groupByProperty?: IPropertyTemplate;
  intl: IntlShape;
  readOnly: boolean;
  addCard: (groupByOptionId?: string, show?: boolean) => Promise<void>;
  propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>;
  onDropToColumn: (srcOption: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => void;
  calculationMenuOpen: boolean;
  onCalculationMenuOpen: () => void;
  onCalculationMenuClose: () => void;
}

const defaultCalculation = 'count';
const defaultProperty: IPropertyTemplate = {
  id: Constants.titleColumnId
} as IPropertyTemplate;

export default function KanbanColumnHeader (props: Props): JSX.Element {
  const { board, activeView, intl, group, groupByProperty } = props;
  const [groupTitle, setGroupTitle] = useState(group.option.value);

  const headerRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'column',
    item: group.option,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));
  const [{ isOver }, drop] = useDrop<IPropertyOption, any, { isOver: boolean }>(() => ({
    accept: 'column',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    drop: (item) => {
      props.onDropToColumn(item, undefined, group.option);
    }
  }), [props.onDropToColumn]);

  useEffect(() => {
    setGroupTitle(group.option.value);
  }, [group.option.value]);

  drop(drag(headerRef));
  let className = 'octo-board-header-cell KanbanColumnHeader';
  if (isOver) {
    className += ' dragover';
  }

  const groupCalculation = props.activeView.fields.kanbanCalculations[props.group.option.id];
  const calculationValue = groupCalculation ? groupCalculation.calculation : defaultCalculation;
  const calculationProperty = groupCalculation
    ? props.board.fields.cardProperties.find((property) => property.id === groupCalculation.propertyId) || defaultProperty
    : defaultProperty;

  return (
    <div
      key={group.option.id || 'empty'}
      ref={headerRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={className}
      draggable={!props.readOnly}
    >
      {groupByProperty && !group.option.id
        && (
          <Label
            title={intl.formatMessage({
              id: 'BoardComponent.no-property-title',
              defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.'
            }, { property: groupByProperty.name })}
          >
            <FormattedMessage
              id='BoardComponent.no-property'
              defaultMessage='No {property}'
              values={{
                property: groupByProperty.name
              }}
            />
          </Label>
        )}
      {group.option.id
        && (
          <Label color={group.option.color}>
            <Editable
              value={groupTitle}
              placeholderText='New Select'
              onChange={setGroupTitle}
              onSave={() => {
                if (groupTitle.trim() === '') {
                  setGroupTitle(group.option.value);
                }
                props.propertyNameChanged(group.option, groupTitle);
              }}
              onCancel={() => {
                setGroupTitle(group.option.value);
              }}
              readOnly={props.readOnly}
              spellCheck={true}
            />
          </Label>
        )}
      <KanbanCalculation
        cards={group.cards}
        menuOpen={props.calculationMenuOpen}
        value={calculationValue}
        property={calculationProperty}
        onMenuClose={props.onCalculationMenuClose}
        onMenuOpen={props.onCalculationMenuOpen}
        cardProperties={board.fields.cardProperties}
        readOnly={props.readOnly}
        onChange={(data: { calculation: string, propertyId: string }) => {
          if (data.calculation === calculationValue && data.propertyId === calculationProperty.id) {
            return;
          }

          const newCalculations = {
            ...props.activeView.fields.kanbanCalculations
          };
          newCalculations[props.group.option.id] = {
            calculation: data.calculation,
            propertyId: data.propertyId
          };

          mutator.changeViewKanbanCalculations(props.activeView.id, props.activeView.fields.kanbanCalculations, newCalculations);
        }}
      />
      <div className='octo-spacer' />
      {!props.readOnly
        && (
          <>
            <MenuWrapper>
              <IconButton icon={<MoreHorizIcon fontSize='small' />} />
              <Menu>
                <Menu.Text
                  id='hide'
                  icon={<VisibilityOffOutlinedIcon fontSize='small' />}
                  name={intl.formatMessage({ id: 'BoardComponent.hide', defaultMessage: 'Hide' })}
                  onClick={() => mutator.hideViewColumn(activeView, group.option.id || '')}
                />
                {group.option.id
                  && (
                    <>
                      <Menu.Text
                        id='delete'
                        icon={<DeleteOutlineIcon fontSize='small' color='secondary' />}
                        name={intl.formatMessage({ id: 'BoardComponent.delete', defaultMessage: 'Delete' })}
                        onClick={() => mutator.deletePropertyOption(board, groupByProperty!, group.option)}
                      />
                      <Menu.Separator />
                      {Object.entries(Constants.menuColors).map(([key, color]) => (
                        <Menu.Color
                          key={key}
                          id={key}
                          name={color}
                          onClick={() => mutator.changePropertyOptionColor(board, groupByProperty!, group.option, key)}
                        />
                      ))}
                    </>
                  )}
              </Menu>
            </MenuWrapper>
            <IconButton
              icon={<AddIcon fontSize='small' />}
              onClick={() => {
                props.addCard(group.option.id, true);
              }}
            />
          </>
        )}
    </div>
  );
}
