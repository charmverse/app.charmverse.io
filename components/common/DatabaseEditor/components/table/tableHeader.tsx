import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import type { PopoverProps } from '@mui/material';
import {
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { bindPopover, bindToggle, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useViewSortOptions } from 'hooks/useViewSortOptions';
import type { Board, IPropertyTemplate } from 'lib/databases/board';
import { isReadonlyPropertyTitle } from 'lib/databases/board';
import type { BoardView, ISortOption } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';
import { Constants } from 'lib/databases/constants';
import { isReturnKey } from 'lib/utils/react';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import { iconForPropertyType } from '../../widgets/iconForPropertyType';
import Label from '../../widgets/label';
import { DeleteRelationPropertyModal } from '../properties/relation/DeleteRelationPropertyModal';

import HorizontalGrip from './horizontalGrip';

type Props = {
  readOnly: boolean;
  sorted: 'up' | 'down' | 'none';
  board: Board;
  activeView: BoardView;
  cards: Card[];
  views: BoardView[];
  template: IPropertyTemplate;
  offset: number;
  onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void;
  onAutoSizeColumn: (columnID: string, headerWidth: number) => void;
  setSelectedPropertyId?: Dispatch<SetStateAction<string | null>>;
};

function TableHeader(props: Props): JSX.Element {
  const { activeView, board, views, cards, sorted, template, readOnly } = props;
  const { type } = template;
  const { id: templateId } = template;
  const name = template.name;
  const [isDragging, isOver, columnRef] = useSortable('column', props.template, !readOnly, props.onDrop);
  const columnWidth = (_templateId: string): number => {
    return Math.max(Constants.minColumnWidth, (activeView.fields.columnWidths[_templateId] || 0) + props.offset);
  };

  const disableRename = isReadonlyPropertyTitle(template);

  const [tempName, setTempName] = useState(name || '');
  const addRelationPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-relation-property' });
  const bindTriggerProps = bindTrigger(addRelationPropertyPopupState);
  const showRelationPropertyDeletePopup = usePopupState({ variant: 'popover', popupId: 'delete-relation-property' });

  const popupState = usePopupState({ variant: 'popper', popupId: 'iframe-selector' });
  const toggleRef = useRef(null);

  const popover = bindPopover(popupState);
  const popoverProps: PopoverProps = {
    ...popover,
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center'
    },
    onClick: (e) => {
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (template.name !== tempName) {
      setTempName(template.name);
    }
  }, [template.name]);

  const popoverToggle = bindToggle(popupState);
  const popoverToggleProps: typeof popoverToggle = {
    ...popoverToggle,
    onClick: (e) => {
      e.stopPropagation();
      popoverToggle.onClick(e);
    }
  };

  const localViewSettings = useLocalDbViewSettings();
  const sortOptions = useViewSortOptions(activeView);

  const changeViewSortOptions = (newSortOptions: ISortOption[]) => {
    // update sort locally if local settings context exist
    if (localViewSettings) {
      localViewSettings.setLocalSort(newSortOptions);
      return;
    }

    mutator.changeViewSortOptions(activeView.id, sortOptions, newSortOptions);
  };
  async function renameColumn() {
    if (tempName !== name) {
      mutator.changePropertyTypeAndName(board, cards, template, type, tempName, views);
    }
    popupState.close();
  }

  popoverProps.onClick = renameColumn;

  const onAutoSizeColumn = React.useCallback((_templateId: string) => {
    let width = Constants.minColumnWidth;
    if (columnRef.current) {
      const { fontDescriptor, padding } = Utils.getFontAndPaddingFromCell(columnRef.current);
      const textWidth = Utils.getTextWidth(columnRef.current.innerText.toUpperCase(), fontDescriptor);
      width = textWidth + padding;
    }
    props.onAutoSizeColumn(_templateId, width);
  }, []);

  let className = 'octo-table-cell header-cell disable-drag-selection';
  if (isOver) {
    className += ' dragover';
  }

  function reverseSort(e: React.MouseEvent<HTMLButtonElement>) {
    changeViewSortOptions([{ propertyId: templateId, reversed: props.sorted === 'up' }]);
    e.stopPropagation();
  }

  async function toggleColumnWrap(
    e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLLIElement, MouseEvent>
  ) {
    e.stopPropagation();
    e.preventDefault();
    const columnWrappedIds = activeView.fields.columnWrappedIds ?? [];
    await mutator.toggleColumnWrap(activeView.id, templateId, columnWrappedIds);
  }

  const isDisabled = !!template.readOnly;
  const popupContent = (
    <Stack>
      <MenuList>
        <Stack p={1}>
          <TextField
            disabled={disableRename}
            value={tempName}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              e.stopPropagation();
              setTempName(e.target.value);
            }}
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation();
              if (isReturnKey(e) && tempName.length !== 0 && tempName !== name) {
                renameColumn();
              }
            }}
          />
        </Stack>
        {template.id !== Constants.titleColumnId && [
          <MenuItem
            key={1}
            {...bindTriggerProps}
            onClick={() => {
              props.setSelectedPropertyId?.(template.id);
            }}
          >
            <ListItemIcon>
              <TuneIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Edit property</Typography>
          </MenuItem>,
          <Divider key={2} />
        ]}
        <MenuItem
          onClick={() => {
            changeViewSortOptions([{ propertyId: templateId, reversed: false }]);
          }}
        >
          <ListItemIcon>
            <ArrowUpwardIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Sort ascending</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            changeViewSortOptions([{ propertyId: templateId, reversed: true }]);
          }}
        >
          <ListItemIcon>
            <ArrowDownwardIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Sort descending</Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            let index = activeView.fields.visiblePropertyIds.findIndex((i) => i === templateId);
            if (templateId === Constants.titleColumnId && index === -1) {
              index = 0;
            }
            mutator.insertPropertyTemplate(board, activeView, index);
          }}
        >
          <ListItemIcon>
            <ArrowBackIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Insert left</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            let index = activeView.fields.visiblePropertyIds.findIndex((i) => i === templateId);
            if (templateId === Constants.titleColumnId && index === -1) {
              index = 0;
            }
            mutator.insertPropertyTemplate(board, activeView, index + 1);
          }}
        >
          <ListItemIcon>
            <ArrowForwardIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Insert right</Typography>
        </MenuItem>
        {templateId !== Constants.titleColumnId && [
          <Divider key='divider' />,
          <MenuItem
            key='hide'
            onClick={() => {
              const viewIds = activeView.fields.visiblePropertyIds.filter((o: string) => o !== templateId);
              mutator.changeViewVisibleProperties(activeView.id, activeView.fields.visiblePropertyIds, viewIds);
            }}
          >
            <ListItemIcon>
              <VisibilityOffOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Hide in view</Typography>
          </MenuItem>,
          <MenuItem
            key='duplicate'
            disabled={isDisabled || template.type === 'relation'}
            onClick={() => {
              mutator.duplicatePropertyTemplate(board, activeView, templateId);
            }}
          >
            <ListItemIcon>
              <ContentCopyOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Duplicate</Typography>
          </MenuItem>,
          <MenuItem
            key='delete'
            disabled={isDisabled}
            onClick={() => {
              if (template.type === 'relation' && template.relationData?.showOnRelatedBoard) {
                showRelationPropertyDeletePopup.open();
              } else {
                mutator.deleteProperty(board, views, cards, templateId);
              }
            }}
          >
            <ListItemIcon>
              <DeleteOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Delete</Typography>
          </MenuItem>
        ]}
        <Divider />
        <MenuItem
          key='toggle-wrap-column'
          onClick={toggleColumnWrap}
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Typography variant='subtitle1'>Wrap column</Typography>
          <Switch
            checked={(activeView.fields.columnWrappedIds ?? []).includes(templateId)}
            onChange={toggleColumnWrap}
          />
        </MenuItem>
      </MenuList>
    </Stack>
  );

  const label = useMemo(
    () => (
      <Label>
        <div style={{ marginRight: 4, display: 'flex' }}>
          {iconForPropertyType(type, {
            sx: {
              width: 18,
              height: 18
            }
          })}
        </div>
        <Tooltip
          disableInteractive
          title={
            template.tooltip ? (
              <div>
                {name}
                <br />
                {template.tooltip}
              </div>
            ) : (
              name
            )
          }
        >
          <Typography
            component='span'
            variant='subtitle1'
            sx={{
              textDecoration: template.deletedAt ? 'line-through' : undefined,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            {name}
          </Typography>
        </Tooltip>
        {!readOnly && (
          <IconButton size='small' sx={{ ml: 1 }} onClick={reverseSort}>
            {sorted === 'up' && <ArrowUpwardOutlinedIcon fontSize='small' />}
            {sorted === 'down' && <ArrowDownwardOutlinedIcon fontSize='small' />}
          </IconButton>
        )}
      </Label>
    ),
    [sorted, name, type]
  );

  return (
    <div
      className={className}
      style={{
        overflow: 'unset',
        width: columnWidth(props.template.id),
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : ''
      }}
      ref={columnRef}
      data-test={`table-property-${template.type}`}
    >
      <Stack width='100%' justifyContent='center'>
        {readOnly ? (
          label
        ) : (
          <div ref={toggleRef}>
            <div {...popoverToggleProps}>{label}</div>
            <Popover {...popoverProps}>
              <Paper>{popupContent}</Paper>
            </Popover>
          </div>
        )}
      </Stack>
      <div className='octo-spacer' />
      {!readOnly && <HorizontalGrip templateId={templateId} onAutoSizeColumn={onAutoSizeColumn} />}
      {showRelationPropertyDeletePopup.isOpen && (
        <DeleteRelationPropertyModal
          board={board}
          onClose={showRelationPropertyDeletePopup.close}
          template={template}
        />
      )}
    </div>
  );
}

export default React.memo(TableHeader);
