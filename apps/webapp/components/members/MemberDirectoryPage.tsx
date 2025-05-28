import { styled } from '@mui/material';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import { ToggleViewSidebarButton } from 'components/common/DatabaseEditor/components/viewHeader/ToggleViewSidebarButton';
import { StyledTab } from 'components/common/DatabaseEditor/components/viewHeader/viewTabs';
import { iconForViewType } from 'components/common/DatabaseEditor/components/viewMenu';
import { SortMenuButton } from 'components/common/DatabaseEditor/components/ViewSortControl';
import ErrorPage from 'components/common/errors/ErrorPage';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useFilteredMembers } from 'components/members/hooks/useFilteredMembers';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import type { Member } from '@packages/lib/members/interfaces';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

import { MemberDirectoryGalleryView } from './components/MemberDirectoryGalleryView';
import { MemberDirectorySearchBar } from './components/MemberDirectorySearchBar';
import { MemberPropertiesSidebar } from './components/MemberDirectorySidebar/MemberPropertiesSidebar';
import { MemberDirectoryTableView } from './components/MemberDirectoryTableView';
import type { SortValue } from './components/SortMenuItems';
import { SortMenuItems } from './components/SortMenuItems';

const views = ['gallery', 'table'] as const;
type View = (typeof views)[number];

const defaultSort = {
  value: 'username' as const,
  reversed: false
};

function memberNamePropertyValue(member: Member) {
  return member.username.startsWith('0x') ? `zzzzzzzz${member.username}` : member.username;
}

export function MemberDirectoryPage({ title }: { title: string }) {
  const router = useRouter();
  const [sortState, setSortState] = useState<{ value: SortValue; reversed: boolean }>(defaultSort);
  const [currentView, setCurrentView] = useState<View>((router.query.view as View) ?? 'gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredMembers = useFilteredMembers(searchQuery);
  const { hasAccess: showDirectory, isLoadingAccess } = useHasMemberLevel('member');

  const sortedMembers = useMemo(() => {
    const result: Member[] = [...filteredMembers]; // using mutative methods below
    if (sortState.value === 'username') {
      result.sort((mem1, mem2) => (memberNamePropertyValue(mem1) > memberNamePropertyValue(mem2) ? 1 : -1));
    } else if (sortState.value === 'join_date') {
      result.sort((mem1, mem2) => (mem1.joinDate > mem2.joinDate ? 1 : -1));
    }
    if (sortState.reversed) {
      result.reverse();
    }
    return result;
  }, [sortState, filteredMembers]);

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
      <Box mb={2}>
        <div className='ViewHeader'>
          <Tabs
            textColor='primary'
            indicatorColor='secondary'
            // value={currentView}
            value={false} // use false to disable the indicator
            sx={{ minHeight: 0, mb: '-5px' }}
          >
            {views.map((view) => (
              <StyledTab
                key={view}
                isActive={currentView === view}
                icon={iconForViewType(view)}
                label={view[0].toUpperCase() + view.slice(1)}
                onClick={() => {
                  setCurrentView(view);
                  setUrlWithoutRerender(router.pathname, { view });
                }}
              />
            ))}
          </Tabs>
          <div className='octo-spacer' />
          <div className='view-actions'>
            <SortMenuButton
              // show sort if not using default
              hasSort={sortState.value !== defaultSort.value || sortState.reversed !== defaultSort.reversed}
              menuItems={
                <SortMenuItems value={sortState.value} reversed={sortState.reversed} onChange={setSortState} />
              }
            />
            <ToggleViewSidebarButton
              onClick={() => {
                setTimeout(() => {
                  setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible);
                });
              }}
            />
          </div>
        </div>
      </Box>
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
