import { Add as AddIcon } from '@mui/icons-material';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardMotion } from '@packages/connect-shared/components/common/Motions/CardMotion';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function NewProjectItem({ children, href }: { children: ReactNode; href: string }) {
  return (
    <CardMotion>
      <CardActionArea
        LinkComponent={Link}
        href={href}
        data-test='create-new-project'
        hrefLang='en'
        sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'normal', justifyContent: 'flex-start' }}
      >
        <Box
          border='1px solid var(--charm-palette-divider)'
          width={100}
          height={100}
          alignItems='center'
          justifyContent='center'
          display='flex'
        >
          <AddIcon fontSize='large' />
        </Box>
        <CardContent component={Box} display='flex' justifyContent='center' alignItems='center' gap={1}>
          <Typography variant='h6'>{children}</Typography>
        </CardContent>
      </CardActionArea>
    </CardMotion>
  );
}
