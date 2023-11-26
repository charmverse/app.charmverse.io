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
  Typography,
  Switch
} from '@mui/material';
import { bindPopover, bindToggle, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useMemo, useRef, useState } from 'react';

import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useViewSortOptions } from 'hooks/useViewSortOptions';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { proposalPropertyTypesList } from 'lib/focalboard/board';
import type { BoardView, ISortOption } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID
} from 'lib/proposal/blocks/constants';
import { defaultRewardPropertyIds } from 'lib/rewards/blocks/constants';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { Utils } from '../../utils';
import { iconForPropertyType } from '../../widgets/iconForPropertyType';
import Label from '../../widgets/label';

import HorizontalGrip from './horizontalGrip';

type Props = {
  readOnly: boolean;
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

const DEFAULT_BLOCK_IDS = [
  DEFAULT_BOARD_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  STATUS_BLOCK_ID,
  EVALUATION_TYPE_BLOCK_ID,
  AUTHORS_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID
];

function TableHeader(props: Props): JSX.Element {
  const { activeView, board, views, cards, sorted, name, type, template, readOnly } = props;
  const { id: templateId } = template;
  const [isDragging, isOver, columnRef] = useSortable('column', props.template, !readOnly, props.onDrop);
  const columnWidth = (_templateId: string): number => {
    return Math.max(Constants.minColumnWidth, (activeView.fields.columnWidths[_templateId] || 0) + props.offset);
  };

  const disableRename =
    proposalPropertyTypesList.includes(type as any) ||
    DEFAULT_BLOCK_IDS.includes(templateId) ||
    defaultRewardPropertyIds.includes(templateId);

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
              if (e.code === 'Enter' && tempName.length !== 0) {
                renameColumn();
              }
            }}
          />
        </Stack>
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
            disabled={proposalPropertyTypesList.includes(type as any) || defaultRewardPropertyIds.includes(templateId)}
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
            disabled={proposalPropertyTypesList.includes(type as any) || defaultRewardPropertyIds.includes(templateId)}
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
    </div>
  );
}

export default React.memo(TableHeader);
