
import styled from '@emotion/styled';
import Workspaces from 'components/common/PageLayout/components/Sidebar/Workspaces';

const SidebarContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.palette.sidebar.background};
  height: 100%;

  .add-a-page {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover {
    .sidebar-header {
      .MuiTypography-root {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .MuiIconButton-root {
        opacity: 1;
      }
    }
  }

  &:hover .add-a-page {
    opacity: 1;
  }
`;

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar ({ closeSidebar }: SidebarProps) {

  return (
    <SidebarContainer>
      <Workspaces />
    </SidebarContainer>
  );
}
