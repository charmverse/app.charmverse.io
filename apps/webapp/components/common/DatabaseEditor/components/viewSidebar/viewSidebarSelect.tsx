import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/GroupWorkOutlined';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PreviewIcon from '@mui/icons-material/Preview';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import { capitalize } from '@packages/utils/strings';
import { FcGoogle } from 'react-icons/fc';
import { RiFolder2Line } from 'react-icons/ri';

import { PageIcon } from 'components/common/PageIcon';
import { usePages } from 'hooks/usePages';
import type { Board, DataSourceType, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';

import { DatabaseSidebarHeader } from './databaseSidebarHeader';
import { ProposalSourceDialogButton } from './viewSourceOptions/components/ProposalSourceProperties/ProposalSourceDialogButton';

export type SidebarView = 'view-options' | 'layout' | 'card-properties' | 'group-by' | 'source' | 'card-property';

function MenuRow({
  icon,
  title,
  value,
  onClick
}: {
  icon: JSX.Element;
  title: string;
  value?: string;
  onClick?: () => void;
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
      {/** Necessary to ensure an item without an onClick action is not unaligned */}
      {onClick ? <ArrowRightIcon color='secondary' /> : <div style={{ paddingRight: '15px' }} />}
    </MenuItem>
  );
}

type Props = {
  setSidebarView: (view: SidebarView) => void;
  closeSidebar: () => void;
  view?: BoardView;
  board?: Board;
  groupByProperty?: IPropertyTemplate;
  hideLayoutOptions?: boolean;
  hideSourceOptions?: boolean;
  hideGroupOptions?: boolean;
  hidePropertiesRow?: boolean;
};

type SourceIconType = DataSourceType | 'linked';

type SourceIconProps = {
  sourceType: SourceIconType;
};

function SourceIcon({ sourceType }: SourceIconProps) {
  const style = { color: 'var(--secondary-text)' };

  if (sourceType === 'proposals') {
    return <TaskOutlinedIcon style={style} />;
  } else if (sourceType === 'google_form') {
    return <FcGoogle style={style} />;
  } else if (sourceType === 'linked') {
    return <PageIcon pageType='linked_board' />;
  } else {
    return <RiFolder2Line style={style} />;
  }
}

export function ViewSidebarSelect({
  setSidebarView,
  closeSidebar,
  view,
  board,
  groupByProperty,
  hideLayoutOptions,
  hideSourceOptions,
  hideGroupOptions,
  hidePropertiesRow
}: Props) {
  const { pages } = usePages();
  const withGroupBy = view?.fields.viewType.match(/board/) || view?.fields.viewType === 'table';
  const currentGroup = board?.fields.cardProperties.find((prop) => prop.id === groupByProperty?.id)?.name;
  const currentLayout = view?.fields.viewType;
  const visiblePropertyIds = view?.fields.visiblePropertyIds ?? [];
  const currentProperties = visiblePropertyIds.filter((id) =>
    board?.fields.cardProperties.some((c) => c.id === id)
  ).length;

  let sourceTitle = 'Database';

  let sourceIconType: SourceIconType = 'board_page';

  const linkedSourcePage = view && pages ? pages[view.fields.linkedSourceId ?? ''] : undefined;
  if (linkedSourcePage) {
    sourceTitle = linkedSourcePage.title;
    sourceIconType = 'linked';
  } else if (view?.fields.sourceType === 'google_form') {
    sourceTitle = view?.fields.sourceData?.formName ?? 'Google Form';
    sourceIconType = 'google_form';
  } else if (board?.fields.sourceType === 'proposals') {
    sourceTitle = 'Proposals';
    sourceIconType = 'proposals';
  }

  return (
    <>
      <DatabaseSidebarHeader title='View options' onClose={closeSidebar} />
      {!hideLayoutOptions && (
        <MenuRow
          onClick={() => setSidebarView('layout')}
          icon={<PreviewIcon color='secondary' />}
          title='Layout'
          value={capitalize(currentLayout)}
        />
      )}
      {!hidePropertiesRow && (
        <MenuRow
          onClick={() => setSidebarView('card-properties')}
          icon={<FormatListBulletedIcon color='secondary' />}
          title='Properties'
          value={currentProperties > 0 ? `${currentProperties} shown` : 'None'}
        />
      )}
      {withGroupBy && !hideGroupOptions && (
        <MenuRow
          onClick={() => setSidebarView('group-by')}
          icon={<GroupIcon color='secondary' />}
          title='Group'
          value={currentGroup ?? 'None'}
        />
      )}

      {!hideSourceOptions && (
        <MenuRow
          onClick={sourceIconType === 'proposals' ? undefined : () => setSidebarView('source')}
          icon={<SourceIcon sourceType={sourceIconType} />}
          title='Source'
          value={sourceTitle}
        />
      )}

      {board && board.fields.sourceType === 'proposals' && <ProposalSourceDialogButton board={board} />}
    </>
  );
}
