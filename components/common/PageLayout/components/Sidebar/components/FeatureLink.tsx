import { ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import Link from 'components/common/Link';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { MappedFeature } from 'lib/features/constants';

import { PageIcon } from '../../../../PageIcon';

import { AddIconButton } from './AddIconButton';
import { SidebarLink } from './SidebarButton';

type PopupMenu = 'rewards' | 'proposals';

export function FeatureLink({ feature, onClick }: { feature: MappedFeature; onClick?: VoidFunction }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { router } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  const [visibleMenu, setVisibleMenu] = useState<PopupMenu | false>(false);
  const isAdmin = useIsAdmin();

  const handleClick = (event: MouseEvent<HTMLButtonElement>, menu: PopupMenu) => {
    if (isAdmin) {
      setVisibleMenu(menu);
      setAnchorEl(event.currentTarget);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleClose = (event?: any) => {
    setAnchorEl(null);
    event?.stopPropagation();
  };

  return (
    <SidebarLink
      href={`/${feature.path}`}
      active={router.pathname.startsWith(`/[domain]/${feature.path}`)}
      icon={<PageIcon icon={null} pageType={feature.path} />}
      label={feature.title}
      onClick={onClick}
      data-test={`sidebar-link-${feature.path}`}
      sx={{ pr: '8px !important' }}
    >
      <span className='add-a-page'>
        {feature.id === 'forum' && (
          <Link href='/forum?new=1'>
            <AddIconButton tooltip='Add a Post' />
          </Link>
        )}
        {feature.id === 'rewards' && (
          <Link href='/rewards?new=1'>
            <AddIconButton onClick={(e) => handleClick(e, 'rewards')} tooltip={`Add a ${getFeatureTitle('Reward')}`} />
          </Link>
        )}
        {feature.id === 'proposals' && (
          <Link href='/proposals/new'>
            <AddIconButton
              onClick={(e) => handleClick(e, 'proposals')}
              tooltip={`Add a ${getFeatureTitle('Proposal')}`}
            />
          </Link>
        )}
      </span>
      {visibleMenu === 'proposals' && (
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
          <MenuItem component={Link} href='/proposals/new' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Proposal')}</ListItemText>
          </MenuItem>
          {/* create a linked board page by default, which can be changed to 'board' by the user */}
          <MenuItem component={Link} href='/proposals/new?type=proposal_template' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Proposal')} Template</ListItemText>
          </MenuItem>
        </Menu>
      )}
      {visibleMenu === 'rewards' && (
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
          <MenuItem component={Link} href='/rewards?new=1' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Reward')}</ListItemText>
          </MenuItem>
          {/* create a linked board page by default, which can be changed to 'board' by the user */}
          <MenuItem component={Link} href='/rewards?new_template=1' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Reward')} Template</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </SidebarLink>
  );
}
