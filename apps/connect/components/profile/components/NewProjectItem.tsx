import { Add as AddIcon } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function NewProjectItem({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Card>
      <CardActionArea
        LinkComponent={Link}
        href={href}
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
    </Card>
  );
}
