import { Box, Tab, Tabs, tabClasses, tabsClasses } from '@mui/material';
import Link from 'next/link';

export function PublicProfileMenu({ tab, username }: { tab: string; username: string }) {
  const value = ['scout', 'builder'].includes(tab) ? tab : 'scout';

  return (
    <Box width='100%'>
      <Tabs
        value={value}
        aria-label='scout game profile tabs'
        role='navigation'
        sx={{
          [`& .${tabsClasses.flexContainer}`]: {
            justifyContent: 'center'
          },
          [`& .${tabsClasses.indicator}`]: {
            bottom: 3
          },
          [`& .${tabClasses.root}`]: {
            borderBottom: '1px solid',
            borderColor: 'text.primary'
          }
        }}
      >
        <Tab component={Link} label='Scout' href={`/u/${username}/?tab=scout`} value='scout' scroll={false} />
        <Tab component={Link} label='Builder' href={`/u/${username}/?tab=builder`} value='builder' scroll={false} />
      </Tabs>
    </Box>
  );
}
