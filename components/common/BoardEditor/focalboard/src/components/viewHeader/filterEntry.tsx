import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Menu, MenuItem, Popover } from '@mui/material';
import PopupState, { bindMenu, bindPopover, bindTrigger } from 'material-ui-popup-state';
import React from 'react';
import { useIntl } from 'react-intl';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause } from 'lib/focalboard/filterClause';
import { areEqual as areFilterClausesEqual } from 'lib/focalboard/filterClause';
import { createFilterGroup, isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import mutator from '../../mutator';
import { OctoUtils } from '../../octoUtils';
import { Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import SwitchOption from '../../widgets/menu/switchOption';

type Props = {
  properties: IPropertyTemplate[];
  view: BoardView;
  conditionClicked: (optionId: string, filter: FilterClause) => void;
  filter: FilterClause;
};

function FilterEntry(props: Props): JSX.Element {
  const { properties, view, filter } = props;
  const intl = useIntl();
  const template = properties.find((o: IPropertyTemplate) => o.id === filter.propertyId);

  const propertyName = template ? template.name : '(unknown)';
  const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`;

  let displayValue: string;
  if (filter.values.length > 0 && template) {
    displayValue = filter.values
      .map((id) => {
        const option = template.options.find((o) => o.id === id);
        return option?.value || '(Unknown)';
      })
      .join(', ');
  } else {
    displayValue = '(empty)';
  }

  return (
    <div className='FilterEntry' key={key}>
      <PopupState variant='popover' popupId='view-filter'>
        {(popupState) => (
          <>
            <Button {...bindTrigger(popupState)}>{propertyName}</Button>
            <Menu {...bindMenu(popupState)}>
              {properties
                .filter((o: IPropertyTemplate) => o.type === 'select' || o.type === 'multiSelect')
                .map((o: IPropertyTemplate) => (
                  <MenuItem
                    key={o.id}
                    id={o.id}
                    onClick={() => {
                      const filterIndex = view.fields.filter.filters.indexOf(filter);
                      Utils.assert(filterIndex >= 0, "Can't find filter");
                      const filterGroup = createFilterGroup(view.fields.filter);
                      const newFilter = filterGroup.filters[filterIndex] as FilterClause;
                      Utils.assert(newFilter, `No filter at index ${filterIndex}`);
                      if (newFilter.propertyId !== o.id) {
                        newFilter.propertyId = o.id;
                        newFilter.values = [];
                        mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                      }
                    }}
                  >
                    {o.name}
                  </MenuItem>
                ))}
            </Menu>
          </>
        )}
      </PopupState>

      <PopupState variant='popover' popupId='view-filter'>
        {(popupState) => (
          <>
            <Button {...bindTrigger(popupState)}>
              {OctoUtils.filterConditionDisplayString(filter.condition, intl)}
            </Button>
            <Menu {...bindMenu(popupState)}>
              <MenuItem id='includes' onClick={() => props.conditionClicked('includes', filter)}>
                {intl.formatMessage({ id: 'Filter.includes', defaultMessage: 'includes' })}
              </MenuItem>
              <MenuItem id='notIncludes' onClick={() => props.conditionClicked('notIncludes', filter)}>
                {intl.formatMessage({ id: 'Filter.not-includes', defaultMessage: 'does not include' })}
              </MenuItem>
              <MenuItem id='isEmpty' onClick={() => props.conditionClicked('isEmpty', filter)}>
                {intl.formatMessage({ id: 'Filter.is-empty', defaultMessage: 'is empty' })}
              </MenuItem>
              <MenuItem id='isNotEmpty' onClick={() => props.conditionClicked('isNotEmpty', filter)}>
                {intl.formatMessage({ id: 'Filter.is-not-empty', defaultMessage: 'is not empty' })}
              </MenuItem>
            </Menu>
          </>
        )}
      </PopupState>

      {(filter.condition === 'includes' || filter.condition === 'notIncludes') && (
        <PopupState variant='popover' popupId='view-filter-value'>
          {(popupState) => (
            <>
              <Button {...bindTrigger(popupState)}>{displayValue}</Button>
              <Popover
                {...bindPopover(popupState)}
                PaperProps={{
                  sx: {
                    overflow: 'visible'
                  }
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                {template?.options.map((o) => (
                  <Box
                    key={o.id}
                    py={1}
                    sx={{
                      background: 'rgb(var(--center-channel-bg-rgb))',
                      '& > div': { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
                      '& .Switch': { mx: 1 },
                      '& .menu-name': { ml: 1 }
                    }}
                  >
                    <SwitchOption
                      id={o.id}
                      name={o.value}
                      isOn={filter.values.includes(o.id)}
                      onClick={() => {
                        const filterIndex = view.fields.filter.filters.indexOf(filter);
                        Utils.assert(filterIndex >= 0, "Can't find filter");

                        const filterGroup = createFilterGroup(view.fields.filter);
                        const newFilter = filterGroup.filters[filterIndex] as FilterClause;
                        Utils.assert(newFilter, `No filter at index ${filterIndex}`);
                        if (filter.values.includes(o.id)) {
                          newFilter.values = newFilter.values.filter((id) => id !== o.id);
                          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                        } else {
                          newFilter.values.push(o.id);
                          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                        }
                      }}
                    />
                  </Box>
                ))}
              </Popover>
            </>
          )}
        </PopupState>
      )}
      <div className='octo-spacer' />
      <Button
        onClick={() => {
          const filterGroup = createFilterGroup(view.fields.filter);
          filterGroup.filters = filterGroup.filters.filter(
            (o) => isAFilterGroupInstance(o) || !areFilterClausesEqual(o, filter)
          );
          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
        }}
      >
        <DeleteOutlinedIcon fontSize='small' />
      </Button>
    </div>
  );
}

export default React.memo(FilterEntry);
