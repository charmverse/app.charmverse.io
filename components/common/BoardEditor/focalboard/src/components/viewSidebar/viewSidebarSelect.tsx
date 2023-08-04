import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/GroupWorkOutlined';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PreviewIcon from '@mui/icons-material/Preview';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import { capitalize } from 'lodash';
import { FcGoogle } from 'react-icons/fc';
import type { IconType } from 'react-icons/lib';
import { RiFolder2Line } from 'react-icons/ri';

import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

export type SidebarView = 'view-options' | 'layout' | 'card-properties' | 'group-by' | 'source';

export const initialSidebarState: SidebarView = 'view-options';

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

type Props = {
  setSidebarView: (view: SidebarView) => void;
  view?: BoardView;
  board?: Board;
  groupByProperty?: IPropertyTemplate;
  showSourceSelectionOption: boolean;
};

export function ViewSidebarSelect({ setSidebarView, view, board, groupByProperty, showSourceSelectionOption }: Props) {
  const { pages } = usePages();

  const withGroupBy = view?.fields.viewType.match(/board/) || view?.fields.viewType === 'table';
  const currentGroup = board?.fields.cardProperties.find((prop) => prop.id === groupByProperty?.id)?.name;
  const currentLayout = view?.fields.viewType;
  const visiblePropertyIds = view?.fields.visiblePropertyIds ?? [];
  const currentProperties = visiblePropertyIds.filter((id) =>
    board?.fields.cardProperties.some((c) => c.id === id)
  ).length;

  let SourceIcon: IconType | OverridableComponent<SvgIconTypeMap<object, 'svg'>> = RiFolder2Line;
  let sourceTitle = 'None';
  const sourcePage = view && pages ? pages[view.fields.linkedSourceId ?? ''] : '';
  if (sourcePage) {
    sourceTitle = sourcePage.title;
  } else if (view?.fields.sourceType === 'google_form') {
    sourceTitle = view?.fields.sourceData?.formName ?? 'Google Form';
    SourceIcon = FcGoogle;
  } else if (board?.fields.sourceType === 'proposals') {
    sourceTitle = 'Proposals';
    SourceIcon = TaskOutlinedIcon;
  }

  return (
    <>
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
      {showSourceSelectionOption && (
        <MenuRow
          onClick={() => setSidebarView('source')}
          icon={<SourceIcon style={{ color: 'var(--secondary-text)' }} />}
          title='Source'
          value={sourceTitle}
        />
      )}
    </>
  );
}
