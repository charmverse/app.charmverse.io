import { styled } from '@mui/material';
import type { MappedFeature } from '@packages/features/constants';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import Link from 'components/common/Link';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { PageIcon } from '../../../../PageIcon';

import { AddIconButton } from './AddIconButton';
import { SidebarLink } from './SidebarButton';

type PopupMenu = 'rewards' | 'proposals';

const StyledSidebarLink = styled(SidebarLink)`
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .hover-action {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    &:hover {
      .hover-action {
        opacity: 1;
      }
    }
  }
`;

export function FeatureLink({ feature, onClick }: { feature: MappedFeature; onClick?: VoidFunction }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { router } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  const [visibleMenu, setVisibleMenu] = useState<PopupMenu | false>(false);

  // left this in for future use, if we want to have menus open up including templates
  const handleClick = (event: MouseEvent<HTMLButtonElement>, menu: PopupMenu) => {
    setVisibleMenu(menu);
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClose = (event?: any) => {
    setAnchorEl(null);
    event?.stopPropagation();
  };

  return (
    <StyledSidebarLink
      href={`/${feature.path}`}
      active={router.pathname.startsWith(`/[domain]/${feature.path}`)}
      icon={<PageIcon icon={null} pageType={feature.path} />}
      label={feature.title}
      onClick={onClick}
      data-test={`sidebar-link-${feature.path}`}
      sx={{ pr: '8px !important' }}
    >
      <span className='hover-action'>
        {feature.id === 'forum' && (
          <Link href='/forum?new=1'>
            <AddIconButton tooltip='Add a Post' />
          </Link>
        )}
        {feature.id === 'rewards' && (
          <Link href='/rewards?new=1'>
            <AddIconButton tooltip={`Add a ${getFeatureTitle('Reward')}`} />
          </Link>
        )}
        {feature.id === 'proposals' && (
          <Link href='/proposals/new'>
            <AddIconButton tooltip={`Add a ${getFeatureTitle('Proposal')}`} />
          </Link>
        )}
      </span>
      {/* {visibleMenu === 'proposals' && (
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
          <MenuItem component={Link} href='/proposals/new' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Proposal')}</ListItemText>
          </MenuItem>
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
          <MenuItem component={Link} href='/rewards?new_template=1' onClick={handleClose}>
            <ListItemText>Add {getFeatureTitle('Reward')} Template</ListItemText>
          </MenuItem>
        </Menu>
      )} */}
    </StyledSidebarLink>
  );
}
