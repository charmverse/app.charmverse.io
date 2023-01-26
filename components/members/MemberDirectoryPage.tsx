import styled from '@emotion/styled';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
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

export default function MemberDirectoryPage() {
  const router = useRouter();
  const { members } = useMembers();
  const [searchedMembers, setSearchedMembers] = useState<Member[]>(members);
  const { properties = [] } = useMemberProperties();
  const [currentView, setCurrentView] = useState<View>((router.query.view as View) ?? 'gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const nameProperty = properties.find((property) => property.type === 'name') ?? null;

  const sortedMembers = searchedMembers.sort((mem1, mem2) => {
    const member1Property = mem1.properties.find((prop) => prop.memberPropertyId === nameProperty?.id);
    const member2Property = mem2.properties.find((prop) => prop.memberPropertyId === nameProperty?.id);
    const member1Name = (member1Property?.value ?? mem1.username).toString();
    const member2Name = (member2Property?.value ?? mem2.username).toString();
    const isMember1NameWallet = member1Name.startsWith('0x');
    const isMember2NameWallet = member2Name.startsWith('0x');
    // Making sure wallet named are pushed back to last
    if (isMember1NameWallet && isMember2NameWallet) {
      return 0;
    } else if (isMember1NameWallet && !isMember2NameWallet) {
      return 1;
    } else if (!isMember1NameWallet && isMember2NameWallet) {
      return -1;
    } else {
      return member1Name > member2Name ? 1 : -1;
    }
  });

  return (
    <CenteredPageContent>
      <Typography variant='h1' my={2}>
        Member Directory
      </Typography>
      <MemberDirectorySearchBar onChange={setSearchedMembers} />
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
