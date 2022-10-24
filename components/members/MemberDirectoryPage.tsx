import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import { Box, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

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
type View = typeof views[number];

export default function MemberDirectoryPage () {
  const router = useRouter();
  const { members } = useMembers();
  const [searchedMembers, setSearchedMembers] = useState<Member[]>(members);
  const { properties } = useMemberProperties();
  const [currentView, setCurrentView] = useState<View>(router.query.view as View ?? 'gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);

  return properties && searchedMembers ? (
    <CenteredPageContent>
      <Typography variant='h1' my={2}>Member Directory</Typography>
      <MemberDirectorySearchBar
        onChange={setSearchedMembers}
      />
      <Stack flexDirection='row' justifyContent='space-between'>
        <Tabs textColor='primary' indicatorColor='secondary' value={currentView} sx={{ minHeight: 0, height: 'fit-content' }}>
          {views.map(view => (
            <Tab
              component='div'
              disableRipple
              key={view}
              label={(
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
              )}
              sx={{ p: 0, mb: '5px' }}
              value={view}
            />
          ))}
        </Tabs>
        <IconButton onClick={() => {
          setTimeout(() => {
            setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible);
          });
        }}
        >
          <MoreHoriz color='secondary' />
        </IconButton>
      </Stack>
      <Box position='relative' display='flex' height='100%'>
        <Box width='100%' overflow='auto' height='fit-content'>
          {currentView === 'table' && <MemberDirectoryTableView members={searchedMembers} />}
          {currentView === 'gallery' && <MemberDirectoryGalleryView members={searchedMembers} />}
        </Box>
        <MemberPropertiesSidebar
          isOpen={isPropertiesDrawerVisible}
          onClose={() => {
            setIsPropertiesDrawerVisible(false);
          }}
        />
      </Box>
    </CenteredPageContent>
  ) : null;
}
