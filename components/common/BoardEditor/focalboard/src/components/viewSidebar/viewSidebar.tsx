import styled from '@emotion/styled';
import BackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/GroupWorkOutlined';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  Box,
  ClickAwayListener,
  Collapse,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography
} from '@mui/material';
import { capitalize } from 'lodash';
import { memo, useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { RiFolder2Line } from 'react-icons/ri';

import { createTableView } from 'components/common/BoardEditor/focalboard/src/components/addViewMenu';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView, BoardViewFields } from 'lib/focalboard/boardView';

import mutator from '../../mutator';

import GroupOptions from './viewGroupOptions';
import ViewLayoutOptions from './viewLayoutOptions';
import ViewPropertyOptions from './viewPropertyOptions';
import { ViewSourceOptions } from './viewSourceOptions';

interface Props {
  board?: Board;
  parentBoard: Board; // we need the parent board when creating or updating the view
  view: BoardView;
  closeSidebar: () => void;
  isOpen: boolean;
  groupByProperty?: IPropertyTemplate;
}

export const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 275px;
  }
`;

type SidebarView = 'view-options' | 'layout' | 'card-properties' | 'group-by' | 'source';

const initialState: SidebarView = 'view-options';

function ViewSidebar(props: Props) {
  const [sidebarView, setSidebarView] = useState<SidebarView>(initialState);
  const { pages } = usePages();

  const withGroupBy = props.view.fields.viewType.match(/board/) || props.view.fields.viewType === 'table';
  const currentGroup = props.board?.fields.cardProperties.find((prop) => prop.id === props.groupByProperty?.id)?.name;
  const currentLayout = props.view.fields.viewType;
  const visiblePropertyIds = props.view.fields.visiblePropertyIds ?? [];
  const currentProperties = visiblePropertyIds.filter((id) =>
    props.board?.fields.cardProperties.some((c) => c.id === id)
  ).length;

  let SourceIcon = RiFolder2Line;
  let sourceTitle = 'None';
  const sourcePage = pages[props.view.fields.linkedSourceId ?? ''];
  if (sourcePage) {
    sourceTitle = sourcePage.title;
  } else if (props.view.fields.sourceType === 'google_form') {
    sourceTitle = props.view.fields.sourceData?.formName ?? 'Google Form';
    SourceIcon = FcGoogle;
  }

  function goBack() {
    setSidebarView(initialState);
  }

  async function selectViewSource(fields: Pick<BoardViewFields, 'linkedSourceId' | 'sourceData' | 'sourceType'>) {
    const newView = createTableView(props.parentBoard, props.view);
    newView.fields.sourceData = fields.sourceData;
    newView.fields.sourceType = fields.sourceType;
    newView.fields.linkedSourceId = fields.linkedSourceId;
    await mutator.updateBlock(newView, props.view, 'change view source');
  }
  useEffect(() => {
    // reset state on close
    if (!props.isOpen) {
      setSidebarView(initialState);
    }
  }, [props.isOpen]);

  return (
    <ClickAwayListener mouseEvent={props.isOpen ? 'onClick' : false} onClickAway={props.closeSidebar}>
      <Collapse
        in={props.isOpen}
        orientation='horizontal'
        sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}
      >
        <StyledSidebar>
          {sidebarView === 'view-options' && (
            <>
              <SidebarHeader title='View options' closeSidebar={props.closeSidebar} />
              <MenuRow
                onClick={() => setSidebarView('layout')}
                icon={<PreviewIcon color='secondary' />}
                title='Layout'
                value={capitalize(currentLayout)}
              />
              <MenuRow
                onClick={() => setSidebarView('card-properties')}
                icon={<FormatListBulletedIcon color='secondary' />}
                title='Properties'
                value={currentProperties > 0 ? `${currentProperties} shown` : 'None'}
              />
              {withGroupBy && (
                <MenuRow
                  onClick={() => setSidebarView('group-by')}
                  icon={<GroupIcon color='secondary' />}
                  title='Group'
                  value={currentGroup ?? 'None'}
                />
              )}
              {props.view.fields.sourceType && (
                <MenuRow
                  onClick={() => setSidebarView('source')}
                  icon={<SourceIcon style={{ color: 'var(--secondary-text)' }} />}
                  title='Source'
                  value={sourceTitle}
                />
              )}
            </>
          )}
          {sidebarView === 'layout' && (
            <>
              <SidebarHeader goBack={goBack} title='Layout' closeSidebar={props.closeSidebar} />
              <ViewLayoutOptions properties={props.board?.fields.cardProperties ?? []} view={props.view} />
            </>
          )}
          {sidebarView === 'card-properties' && (
            <>
              <SidebarHeader goBack={goBack} title='Properties' closeSidebar={props.closeSidebar} />
              <ViewPropertyOptions properties={props.board?.fields.cardProperties ?? []} view={props.view} />
            </>
          )}
          {sidebarView === 'group-by' && (
            <>
              <SidebarHeader goBack={goBack} title='Group by' closeSidebar={props.closeSidebar} />
              <GroupOptions
                properties={props.board?.fields.cardProperties || []}
                view={props.view}
                groupByProperty={props.groupByProperty}
              />
            </>
          )}
          {sidebarView === 'source' && (
            <ViewSourceOptions
              title='Data source'
              view={props.view}
              goBack={goBack}
              onSelect={selectViewSource}
              closeSidebar={props.closeSidebar}
            />
          )}
        </StyledSidebar>
      </Collapse>
    </ClickAwayListener>
  );
}

function MenuRow({
  icon,
  title,
  value,
  onClick
}: {
  icon: JSX.Element;
  title: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <MenuItem dense onClick={onClick}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{title}</ListItemText>
      <Typography
        component='div'
        color='secondary'
        variant='body2'
        sx={{
          flexGrow: 1,
          maxWidth: '45%',
          textAlign: 'right',
          whitespace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {value}
      </Typography>
      <ArrowRightIcon color='secondary' />
    </MenuItem>
  );
}

export function SidebarHeader({
  closeSidebar,
  goBack,
  title
}: {
  closeSidebar: () => void;
  goBack?: () => void;
  title: string;
}) {
  return (
    <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
      <Box display='flex' alignItems='center' gap={1}>
        {goBack && (
          <IconButton size='small' onClick={goBack}>
            <BackIcon fontSize='small' color='secondary' />
          </IconButton>
        )}
        <Typography fontWeight='bold' variant='body2'>
          {title}
        </Typography>
      </Box>
      <IconButton onClick={closeSidebar} size='small'>
        <CloseIcon fontSize='small' />
      </IconButton>
    </Box>
  );
}

export default memo(ViewSidebar);
