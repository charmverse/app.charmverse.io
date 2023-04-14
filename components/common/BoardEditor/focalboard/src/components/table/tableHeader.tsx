import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import type { PopoverProps } from '@mui/material';
import {
  Tooltip,
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { bindPopover, bindToggle, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useMemo, useRef, useState } from 'react';

import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { Constants } from '../../constants';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import Label from '../../widgets/label';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

import HorizontalGrip from './horizontalGrip';

type Props = {
  readOnly: boolean;
  readOnlySourceData: boolean;
  sorted: 'up' | 'down' | 'none';
  name: string;
  board: Board;
  activeView: BoardView;
  cards: Card[];
  views: BoardView[];
  template: IPropertyTemplate;
  offset: number;
  type: PropertyType;
  onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void;
  onAutoSizeColumn: (columnID: string, headerWidth: number) => void;
};

function TableHeader(props: Props): JSX.Element {
  const { activeView, board, views, cards, sorted, name, type, template, readOnly, readOnlySourceData } = props;
  const { id: templateId } = template;
  const [isDragging, isOver, columnRef] = useSortable('column', props.template, !readOnly, props.onDrop);
  const columnWidth = (_templateId: string): number => {
    return Math.max(Constants.minColumnWidth, (activeView.fields.columnWidths[_templateId] || 0) + props.offset);
  };
  const [tempName, setTempName] = useState(props.name || '');

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

  const popoverToggle = bindToggle(popupState);
  const popoverToggleProps: typeof popoverToggle = {
    ...popoverToggle,
    onClick: (e) => {
      e.stopPropagation();
      popoverToggle.onClick(e);
    }
  };

  async function renameColumn() {
    if (tempName !== template.name) {
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

  let className = 'octo-table-cell header-cell';
  if (isOver) {
    className += ' dragover';
  }

  function reverseSort(e: React.MouseEvent<HTMLButtonElement>) {
    mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, [
      { propertyId: templateId, reversed: props.sorted === 'up' }
    ]);
    e.stopPropagation();
  }

  const popupContent = (
    <Stack>
      <MenuList>
        <Stack p={1}>
          <TextField
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
              if (e.code === 'Enter' && tempName.length !== 0) {
                renameColumn();
              }
            }}
          />
        </Stack>
        <MenuItem
          onClick={() => {
            mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, [
              { propertyId: templateId, reversed: false }
            ]);
          }}
        >
          <ListItemIcon>
            <ArrowUpwardIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Sort ascending</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, [
              { propertyId: templateId, reversed: true }
            ]);
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
            if (templateId === Constants.titleColumnId) {
              // eslint-disable-next-line no-warning-comments
              // TODO: Handle name column
            } else {
              const index = activeView.fields.visiblePropertyIds.findIndex((i) => i === templateId);

              // const index = board.fields.cardProperties.findIndex((o: IPropertyTemplate) => o.id === templateId)
              mutator.insertPropertyTemplate(board, activeView, index);
            }
          }}
        >
          <ListItemIcon>
            <ArrowBackIcon fontSize='small' />
          </ListItemIcon>
          <Typography variant='subtitle1'>Insert left</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (templateId === Constants.titleColumnId) {
              // eslint-disable-next-line no-warning-comments
              // TODO: Handle title column
            } else {
              const index = activeView.fields.visiblePropertyIds.findIndex((i) => i === templateId) + 1;

              // const index = board.fields.cardProperties.findIndex((o: IPropertyTemplate) => o.id === templateId) + 1
              mutator.insertPropertyTemplate(board, activeView, index);
            }
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
            onClick={() => {
              mutator.deleteProperty(board, views, cards, templateId);
            }}
          >
            <ListItemIcon>
              <DeleteOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Delete</Typography>
          </MenuItem>
        ]}
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
        <Tooltip disableInteractive title={name}>
          <Typography
            component='span'
            variant='subtitle1'
            sx={{
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
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial'
      }}
      ref={columnRef}
    >
      <Stack width='100%' justifyContent='center'>
        {readOnly || readOnlySourceData ? (
          label
        ) : (
          <div ref={toggleRef}>
            <div {...popoverToggleProps}>{label}</div>
            <Popover disableRestoreFocus {...popoverProps}>
              <Paper>{popupContent}</Paper>
            </Popover>
          </div>
        )}
      </Stack>
      <div className='octo-spacer' />
      {!readOnly && <HorizontalGrip templateId={templateId} onAutoSizeColumn={onAutoSizeColumn} />}
    </div>
  );
}

export default React.memo(TableHeader);
