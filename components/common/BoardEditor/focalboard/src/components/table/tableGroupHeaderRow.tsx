/* eslint-disable max-lines */

import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import { proposalPropertyTypesList } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { Constants } from 'lib/focalboard/constants';
import { EVALUATION_STATUS_LABELS, PROPOSAL_STEP_LABELS } from 'lib/focalboard/proposalDbProperties';
import type { ProposalEvaluationStatus, ProposalEvaluationStep } from 'lib/proposals/interfaces';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import Button from '../../widgets/buttons/button';
import IconButton from '../../widgets/buttons/iconButton';
import Editable from '../../widgets/editable';
import Label from '../../widgets/label';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';

type Props = {
  board: Board;
  activeView: BoardView;
  group: BoardGroup;
  groupByProperty?: IPropertyTemplate;
  readOnly: boolean;
  hideGroup: (groupByOptionId: string) => void;
  addCard: (groupByOptionId?: string) => Promise<void> | void;
  propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>;
  onDrop: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void;
  disableAddingCards?: boolean;
  readOnlyTitle?: boolean;
};

const TableGroupHeaderRow = React.memo((props: Props): JSX.Element => {
  const { board, activeView, group, groupByProperty } = props;
  const [groupTitle, setGroupTitle] = useState(group.option.value);

  const [isDragging, isOver, groupHeaderRef] = useSortable('groupHeader', group.option, !props.readOnly, props.onDrop);
  const intl = useIntl();

  const formattedGroupTitle =
    groupByProperty?.type === 'proposalEvaluationType'
      ? PROPOSAL_STEP_LABELS[group.option.value as ProposalEvaluationStep]
      : groupByProperty?.type === 'proposalStatus'
      ? EVALUATION_STATUS_LABELS[group.option.value as ProposalEvaluationStatus]
      : groupTitle;

  const preventPropertyDeletion =
    props.groupByProperty && proposalPropertyTypesList.includes(props.groupByProperty.type as any);

  useEffect(() => {
    setGroupTitle(group.option.value);
  }, [group.option.value]);
  let className = 'octo-group-header-cell';
  if (isOver) {
    className += ' dragover';
  }
  if (activeView.fields.collapsedOptionIds.indexOf(group.option.id || 'undefined') < 0) {
    className += ' expanded';
  }

  const columnWidth = (templateId: string): number => {
    return Math.max(Constants.minColumnWidth, props.activeView.fields.columnWidths[templateId] || 0);
  };

  return (
    <div
      key={`${group.option.id}header`}
      ref={groupHeaderRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={className}
    >
      <div className='octo-table-cell' style={{ width: columnWidth(Constants.titleColumnId) }}>
        <IconButton
          icon={<ArrowDropDownOutlinedIcon fontSize='small' />}
          onClick={() => (props.readOnly ? {} : props.hideGroup(group.option.id || 'undefined'))}
          className='hello-world'
        />
        {!group.option.id && (
          <Label
            title={`${intl.formatMessage(
              {
                id: 'BoardComponent.no-property-title',
                defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.'
              },
              { property: groupByProperty?.name }
            )}`}
          >
            <FormattedMessage
              id='BoardComponent.no-property'
              defaultMessage='No {property}'
              values={{
                property: `${groupByProperty?.name}`
              }}
            />
          </Label>
        )}
        {group.option.id && (
          <Label color={group.option.color}>
            <Editable
              value={formattedGroupTitle}
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
              readOnly={props.readOnly || !group.option.id || props.readOnlyTitle}
              spellCheck={true}
            />
          </Label>
        )}
      </div>
      <Button>{`${group.cards.length}`}</Button>
      {!props.readOnly && (
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
              {group.option.id && (
                <>
                  {!preventPropertyDeletion && (
                    <Menu.Text
                      id='delete'
                      icon={<DeleteOutlineIcon fontSize='small' color='secondary' />}
                      disabled={preventPropertyDeletion}
                      name={intl.formatMessage({ id: 'BoardComponent.delete', defaultMessage: 'Delete' })}
                      onClick={() => mutator.deletePropertyOption(board, groupByProperty!, group.option)}
                    />
                  )}
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
          {!props.disableAddingCards && (
            <IconButton icon={<AddIcon fontSize='small' />} onClick={() => props.addCard(group.option.id)} />
          )}
        </>
      )}
    </div>
  );
});

export default TableGroupHeaderRow;
