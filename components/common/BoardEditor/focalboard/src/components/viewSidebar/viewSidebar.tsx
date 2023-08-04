import type { PageMeta } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import BackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/GroupWorkOutlined';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PreviewIcon from '@mui/icons-material/Preview';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
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
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import { capitalize } from 'lodash';
import { memo, useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import type { IconType } from 'react-icons/lib';
import { RiFolder2Line } from 'react-icons/ri';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { createTableView } from 'components/common/BoardEditor/focalboard/src/components/addViewMenu';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, DataSourceType } from 'lib/focalboard/board';
import type { BoardView, BoardViewFields } from 'lib/focalboard/boardView';

import mutator from '../../mutator';

import GroupOptions from './viewGroupOptions';
import ViewLayoutOptions from './viewLayoutOptions';
import ViewPropertyOptions from './viewPropertyOptions';
import type { SidebarView } from './viewSidebarSelect';
import { ViewSidebarSelect, initialSidebarState } from './viewSidebarSelect';
import { LinkCharmVerseDatabase } from './viewSourceOptions/components/LinkCharmVerseDatabase';
import { ViewSourceOptions } from './viewSourceOptions/viewSourceOptions';

interface Props {
  board?: Board;
  page?: PageMeta;
  parentBoard: Board; // we need the parent board when creating or updating the view
  view: BoardView;
  views: BoardView[];
  closeSidebar: () => void;
  isOpen: boolean;
  groupByProperty?: IPropertyTemplate;
  pageId?: string;
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
function ViewSidebar(props: Props) {
  const [sidebarView, setSidebarView] = useState<SidebarView>(initialSidebarState);
  const { pages } = usePages();

  const { trigger: updateProposalSource } = useSWRMutation(
    `/api/pages/${props.pageId}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string } }>) => charmClient.updateProposalSource(arg)
  );

  function goToSidebarHome() {
    setSidebarView('view-options');
  }

  async function selectViewSource(
    fields: Pick<BoardViewFields, 'linkedSourceId' | 'sourceData' | 'sourceType'>,
    sourceBoard?: Board
  ) {
    const board = {
      // use parentBoard props like id and rootId by default
      ...props.parentBoard,
      // use fields from the linked board so that fields like 'visiblePropertyIds' are accurate
      fields: sourceBoard?.fields || props.parentBoard.fields
    };
    const newView = createTableView({ board, activeView: props.view });

    // TODO - Migrate this to the board only
    newView.fields.sourceData = fields.sourceData;
    newView.fields.sourceType = fields.sourceType;

    // After migrating sourceData and sourceType, this should only be used for linked views
    newView.fields.linkedSourceId = fields.linkedSourceId;
    await mutator.updateBlock(newView, props.view, 'change view source');
  }
  useEffect(() => {
    // reset state on close
    if (!props.isOpen) {
      setSidebarView(initialSidebarState);
    }
  }, [props.isOpen]);

  useEffect(() => {
    if (props.pageId && props.board?.fields.sourceType === 'proposals' && props.view.parentId === props.pageId) {
      updateProposalSource({ pageId: props.pageId });
    }
  }, [props.pageId, props.view.parentId, props.board?.fields.sourceType]);

  const isLinkedPage = !!String(props.page?.type).match('linked');

  const showSourceSelectionOption =
    props.views.length === 0 ||
    isLinkedPage ||
    props.board?.fields?.sourceType === 'google_form' ||
    props.view.fields.sourceType === 'google_form';

  return (
    <ClickAwayListener mouseEvent={props.isOpen ? 'onClick' : false} onClickAway={props.closeSidebar}>
      <Collapse
        in={props.isOpen}
        orientation='horizontal'
        sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}
      >
        <StyledSidebar>
          <SidebarHeader title='View options' closeSidebar={props.closeSidebar} />

          {sidebarView === 'view-options' && (
            <ViewSidebarSelect
              {...props}
              sidebarView={sidebarView}
              setSidebarView={setSidebarView}
              showSourceSelectionOption={showSourceSelectionOption}
            />
          )}

          {sidebarView === 'layout' && (
            <>
              <SidebarHeader goBack={goToSidebarHome} title='Layout' closeSidebar={props.closeSidebar} />
              <ViewLayoutOptions properties={props.board?.fields.cardProperties ?? []} view={props.view} />
            </>
          )}
          {sidebarView === 'card-properties' && (
            <>
              <SidebarHeader goBack={goToSidebarHome} title='Properties' closeSidebar={props.closeSidebar} />
              <ViewPropertyOptions properties={props.board?.fields.cardProperties ?? []} view={props.view} />
            </>
          )}
          {sidebarView === 'group-by' && (
            <>
              <SidebarHeader goBack={goToSidebarHome} title='Group by' closeSidebar={props.closeSidebar} />
              <GroupOptions
                properties={props.board?.fields.cardProperties || []}
                view={props.view}
                groupByProperty={props.groupByProperty}
              />
            </>
          )}
          {sidebarView === 'source' && (
            <ViewSourceOptions
              views={props.views}
              page={props.page}
              board={props.board}
              title='Data source'
              view={props.view}
              // We don't want to allow going back if this board is locked to charmverse databases
              goBack={goToSidebarHome}
              onSelect={selectViewSource}
              closeSidebar={props.closeSidebar}
              pageId={props.pageId}
            />
          )}
        </StyledSidebar>
      </Collapse>
    </ClickAwayListener>
  );
}

export function SidebarHeader({
  closeSidebar,
  goBack,
  title
}: {
  closeSidebar?: () => void;
  goBack?: () => void;
  title?: string;
}) {
  return (
    <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
      <Box display='flex' alignItems='center' gap={1}>
        {goBack && (
          <IconButton size='small' onClick={goBack}>
            <BackIcon fontSize='small' color='secondary' />
          </IconButton>
        )}
        {title && (
          <Typography fontWeight='bold' variant='body2'>
            {title}
          </Typography>
        )}
      </Box>
      {closeSidebar && (
        <IconButton onClick={closeSidebar} size='small'>
          <CloseIcon fontSize='small' />
        </IconButton>
      )}
    </Box>
  );
}

export default memo(ViewSidebar);
