
import styled from '@emotion/styled';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import Workspaces from 'components/common/PageLayout/components/Sidebar/Workspaces';
import { getDisplayName } from 'lib/users';

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
  const router = useRouter();
  const [user] = useUser();

  const userName = user ? getDisplayName(user) : '';

  return (
    <SidebarContainer>
      <Workspaces />
    </SidebarContainer>
  );
}
