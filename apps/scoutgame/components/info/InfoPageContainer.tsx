import type { StackProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { SidebarInfoDrawer } from './SidebarInfoDrawer';

export function InfoPageContainer({
  children,
  title,
  image,
  ...props
}: { title?: string; image: string } & StackProps) {
  return (
    <>
      <Image
        src={image}
        width={854}
        height={285}
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
        priority={true}
        alt='info banner'
      />
      <Stack flexDirection='row' alignItems='center' justifyContent='space-between' data-test='info-page' {...props}>
        {title && (
          <Typography variant='h4' align='center' color='secondary'>
            {title}
          </Typography>
        )}
        <SidebarInfoDrawer />
      </Stack>
      {children}
    </>
  );
}
