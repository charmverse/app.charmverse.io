import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import { Box, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material';
import type { MemberProperty } from '@prisma/client';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import type { Social } from 'components/profile/interfaces';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { MemberDirectoryGalleryView } from './components/MemberDirectoryGalleryView';
import { MemberPropertiesSidebar } from './components/MemberDirectoryProperties/MemberPropertiesSidebar';
import { MemberDirectorySearchBar } from './components/MemberDirectorySearchBar';
import { MemberDirectorySort } from './components/MemberDirectorySort';
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

function sortMembers (members: Member[], property: MemberProperty) {
  switch (property.type) {
    case 'name':
    case 'phone':
    case 'email':
    case 'text':
    case 'text_multiline':
    case 'url':
      return members.sort((memA, memB) => {
        const memberAProperty = memA.properties.find(prop => prop.memberPropertyId === property.id);
        const memberBProperty = memB.properties.find(prop => prop.memberPropertyId === property.id);
        return (memberAProperty?.value ?? '') > (memberBProperty?.value ?? '') ? 1 : -1;
      });
    case 'timezone': {
      return members.sort((memA, memB) => {
        const memberATimezone = memA.profile?.timezone;
        const memberBTimezone = memB.profile?.timezone;
        return (memberATimezone ?? '') > (memberBTimezone ?? '') ? 1 : -1;
      });
    }
    case 'discord': {
      return members.sort((memA, memB) => {
        const memberADiscordUsername = (memA.profile?.social as Partial<Social>)?.discordUsername;
        const memberBDiscordUsername = (memB.profile?.social as Partial<Social>)?.discordUsername;
        return (memberADiscordUsername ?? '') > (memberBDiscordUsername ?? '') ? 1 : -1;
      });
    }
    case 'twitter': {
      return members.sort((memA, memB) => {
        const memberATwitterURL = (memA.profile?.social as Partial<Social>)?.twitterURL;
        const memberBTwitterURL = (memB.profile?.social as Partial<Social>)?.twitterURL;
        return (memberATwitterURL ?? '') > (memberBTwitterURL ?? '') ? 1 : -1;
      });
    }
    case 'number': {
      return members.sort((memA, memB) => {
        const memberAProperty = memA.properties.find(prop => prop.memberPropertyId === property.id);
        const memberBProperty = memB.properties.find(prop => prop.memberPropertyId === property.id);
        return (memberAProperty?.value ?? 0) > (memberBProperty?.value ?? 0) ? 1 : -1;
      });
    }
    default: {
      return members;
    }
  }
}

export default function MemberDirectoryPage () {
  const router = useRouter();
  const { members } = useMembers();
  const [searchedMembers, setSearchedMembers] = useState<Member[]>(members);
  const { properties = [] } = useMemberProperties();
  const [currentView, setCurrentView] = useState<View>(router.query.view as View ?? 'gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const [sortedProperty, setSortedProperty] = useState<string | null>(properties.find(property => property.type === 'name')?.name ?? null);

  const sortedMembers = useMemo(() => {
    const memberProperty = sortedProperty ? properties.find(property => property.name === sortedProperty) : null;
    if (sortedProperty && memberProperty) {
      return sortMembers(searchedMembers, memberProperty);
    }
    return searchedMembers;
  }, [sortedProperty, properties]);

  return (
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
        <Stack flexDirection='row' gap={1}>
          <MemberDirectorySort
            setSortedProperty={setSortedProperty}
            sortedProperty={sortedProperty}
          />
          <IconButton onClick={() => {
            setTimeout(() => {
              setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible);
            });
          }}
          >
            <MoreHoriz color='secondary' />
          </IconButton>
        </Stack>
      </Stack>
      <Box position='relative' display='flex' height='100%'>
        <Box width='100%' overflow='auto' height='fit-content'>
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
