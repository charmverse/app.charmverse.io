/* eslint-disable max-lines */

import { ArrowDropDown as CollapseIcon, ArrowRight as ExpandIcon } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Tooltip, Typography } from '@mui/material';
import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDisableClickPropagation } from 'hooks/useDisablePropagation';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from 'lib/databases/board';
import { proposalPropertyTypesList } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import { Constants } from 'lib/databases/constants';
import { EVALUATION_STATUS_LABELS, PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
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
  onDrop: (srcOption: BoardGroup, dstOption?: BoardGroup) => void;
  disableAddingCards?: boolean;
  isExpandedGroup?: boolean;
  readOnlyTitle?: boolean;
};
const TableGroupHeaderRow = memo((props: Props): JSX.Element => {
  const { board, activeView, group, groupByProperty } = props;
  const [groupTitle, setGroupTitle] = useState(group.option?.value || group.value || '');
  const { getFeatureTitle } = useSpaceFeatures();

  const [isDragging, isOver, groupHeaderRef] = useSortable('groupHeader', group, !props.readOnly, props.onDrop);
  const intl = useIntl();
  const disableMouseEvents = useDisableClickPropagation();

  const formattedGroupTitle =
    groupByProperty?.type === 'proposalEvaluationType'
      ? PROPOSAL_STEP_LABELS[group.option!.value as ProposalEvaluationStep]
      : groupByProperty?.type === 'proposalStatus'
        ? EVALUATION_STATUS_LABELS[group.option!.value as ProposalEvaluationStatus]
        : groupTitle;

  const preventPropertyDeletion =
    props.groupByProperty && proposalPropertyTypesList.includes(props.groupByProperty.type as any);

  useEffect(() => {
    setGroupTitle(group.option?.value || group.value || '');
  }, [group.option?.value, group.value]);
  let className = 'octo-group-header-cell';
  if (isOver) {
    className += ' dragover';
  }
  const isExpanded = props.isExpandedGroup;
  if (isExpanded) {
    className += ' expanded';
  }

  const columnWidth = (templateId: string): number => {
    return Math.max(Constants.minColumnWidth, props.activeView.fields.columnWidths[templateId] || 0);
  };

  const propertyName = groupByProperty?.name === 'Proposal' ? getFeatureTitle('Proposal') : groupByProperty?.name;

  return (
    <div {...disableMouseEvents /* this should prevent selection but not sure why this doesnt do anything */}>
      <div
        key={`${group.id}header`}
        ref={groupHeaderRef}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={className}
      >
        <div className='octo-table-cell' style={{ width: columnWidth(Constants.titleColumnId) }}>
          <IconButton
            icon={isExpanded ? <CollapseIcon /> : <ExpandIcon />}
            style={{ width: '24px', height: '24px', marginRight: '4px' }}
            onClick={() => (props.readOnly ? {} : props.hideGroup(group.id || ''))}
          />
          {/** Empty  value */}
          {!group.id && (
            <Tooltip
              title={intl.formatMessage(
                {
                  id: 'BoardComponent.no-property-title',
                  defaultMessage:
                    'Items with an empty {propertyName} property will go here. This column cannot be removed.'
                },
                { property: propertyName }
              )}
            >
              <Typography component='span' variant='subtitle1'>
                <FormattedMessage
                  id='BoardComponent.no-property'
                  defaultMessage='No {property}'
                  values={{
                    property: `${propertyName}`
                  }}
                />
              </Typography>
            </Tooltip>
          )}
          {/* Readonly values */}

          {group.value && (
            <Typography component='span' variant='subtitle1'>
              {group.value}
            </Typography>
          )}
          {/* For select/multi-select values */}
          {group.option?.id && (
            <Label color={group.option.color}>
              <Editable
                value={formattedGroupTitle}
                placeholderText='New Select'
                onChange={setGroupTitle}
                onSave={() => {
                  if (props.readOnly) return;
                  if (groupTitle.trim() === '') {
                    setGroupTitle(group.option!.value);
                  }
                  props.propertyNameChanged(group.option!, groupTitle);
                }}
                onCancel={() => {
                  setGroupTitle(group.option!.value);
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
                  onClick={() => mutator.hideViewColumn(activeView, group?.id || '')}
                />
                {group.option?.id && (
                  <>
                    {!preventPropertyDeletion && (
                      <Menu.Text
                        id='delete'
                        icon={<DeleteOutlineIcon fontSize='small' color='secondary' />}
                        disabled={preventPropertyDeletion}
                        name={intl.formatMessage({ id: 'BoardComponent.delete', defaultMessage: 'Delete' })}
                        onClick={() => mutator.deletePropertyOption(board, groupByProperty!, group.option!)}
                      />
                    )}
                    <Menu.Separator />
                    {Object.entries(Constants.menuColors).map(([key, color]) => (
                      <Menu.Color
                        key={key}
                        id={key}
                        name={color}
                        onClick={() => mutator.changePropertyOptionColor(board, groupByProperty!, group.option!, key)}
                      />
                    ))}
                  </>
                )}
              </Menu>
            </MenuWrapper>
            {!props.disableAddingCards && (
              <IconButton icon={<AddIcon fontSize='small' />} onClick={() => props.addCard(group.id)} />
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default TableGroupHeaderRow;
