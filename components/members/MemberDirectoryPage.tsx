import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import { Box, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { iconForViewType } from 'components/common/DatabaseEditor/components/viewMenu';
import ErrorPage from 'components/common/errors/ErrorPage';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useFilteredMembers } from 'components/members/hooks/useFilteredMembers';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utils/browser';

import { MemberDirectoryGalleryView } from './components/MemberDirectoryGalleryView';
import { MemberPropertiesSidebar } from './components/MemberDirectoryProperties/MemberPropertiesSidebar';
import { MemberDirectorySearchBar } from './components/MemberDirectorySearchBar';
import { MemberDirectoryTableView } from './components/MemberDirectoryTableView';

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

const views = ['gallery', 'table'] as const;
type View = (typeof views)[number];

function memberNamePropertyValue(member: Member) {
  return member.username.startsWith('0x') ? `zzzzzzzz${member.username}` : member.username;
}

export default function MemberDirectoryPage({ title }: { title: string }) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>((router.query.view as View) ?? 'gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredMembers = useFilteredMembers(searchQuery);
  const { hasAccess: showDirectory, isLoadingAccess } = useHasMemberLevel('member');

  const sortedMembers = filteredMembers.sort((mem1, mem2) =>
    memberNamePropertyValue(mem1) > memberNamePropertyValue(mem2) ? 1 : -1
  );

  if (isLoadingAccess) {
    return null;
  }

  if (!showDirectory) {
    return <ErrorPage message='Guests cannot access the member directory' />;
  }

  return (
    <CenteredPageContent>
      <Typography variant='h1' my={2}>
        {title}
      </Typography>
      <MemberDirectorySearchBar onChange={setSearchQuery} />
      <Stack flexDirection='row' justifyContent='space-between' mb={1}>
        <Tabs
          textColor='primary'
          indicatorColor='secondary'
          value={currentView}
          sx={{ minHeight: 0, height: 'fit-content' }}
        >
          {views.map((view) => (
            <Tab
              component='div'
              disableRipple
              key={view}
              label={
                <StyledButton
                  startIcon={iconForViewType(view)}
                  onClick={() => {
                    setCurrentView(view);
                    setUrlWithoutRerender(router.pathname, { view });
                  }}
                  variant='text'
                  size='small'
                  color={currentView === view ? 'textPrimary' : 'secondary'}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </StyledButton>
              }
              sx={{ p: 0, mb: '5px' }}
              value={view}
            />
          ))}
        </Tabs>

        <IconButton
          onClick={() => {
            setTimeout(() => {
              setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible);
            });
          }}
        >
          <MoreHoriz color='secondary' />
        </IconButton>
      </Stack>
      <Box position='relative' display='flex' height='100%'>
        <Box width='100%' overflow={currentView === 'table' ? 'auto' : 'visible'} height='fit-content'>
          {currentView === 'table' && <MemberDirectoryTableView members={sortedMembers} />}
          {currentView === 'gallery' && <MemberDirectoryGalleryView members={sortedMembers} />}
        </Box>
        <MemberPropertiesSidebar
          isOpen={isPropertiesDrawerVisible}
          onClose={() => {
            setIsPropertiesDrawerVisible(false);
          }}
        />
      </Box>
    </CenteredPageContent>
  );
}
