import { styled, ClickAwayListener, Collapse, Stack } from '@mui/material';

import { DatabaseSidebarHeader } from 'components/common/DatabaseEditor/components/viewSidebar/databaseSidebarHeader';
import { useMemberProperties } from 'hooks/useMemberProperties';

import { AddMemberPropertyButton } from './AddMemberPropertyButton';
import { MemberPropertySidebarItem } from './MemberPropertiesSidebarItem';

const StyledSidebar = styled('div')`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: fit-content;
  min-height: 100%;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

export function MemberPropertiesSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { properties } = useMemberProperties();

  return properties ? (
    <ClickAwayListener mouseEvent='onClick' onClickAway={onClose}>
      <Collapse
        in={isOpen}
        orientation='horizontal'
        sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000, height: 'fit-content', marginBottom: 1 }}
      >
        <StyledSidebar>
          <DatabaseSidebarHeader onClose={onClose} title='Properties' />
          <Stack height='fit-content'>
            {properties.map((property) => (
              <MemberPropertySidebarItem property={property} key={property.id} />
            ))}
          </Stack>
          <AddMemberPropertyButton />
        </StyledSidebar>
      </Collapse>
    </ClickAwayListener>
  ) : null;
}
