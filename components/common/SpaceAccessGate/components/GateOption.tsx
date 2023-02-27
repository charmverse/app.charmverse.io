import type { SxProps, Theme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { VerifyCheckmark } from './VerifyCheckmark';

interface Props {
  description: string;
  isVerified: boolean | null; // null means we have not checked yet
  isVerifying?: boolean;
  children?: ReactNode;
}

export function GateOption({ children, description, isVerified, isVerifying }: Props) {
  // Extra styling if the user was able to verify with the gate
  const isVerifiedBorderProps: SxProps<Theme> = isVerified
    ? {
        borderColor: 'success.main',
        borderWidth: 1,
        borderStyle: 'solid'
      }
    : {};

  return (
    <Card
      variant='outlined'
      raised={isVerified === true}
      color={isVerified === true ? 'success' : 'default'}
      sx={{ my: 1, ...isVerifiedBorderProps }}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography>{description}</Typography>
          </Grid>

          <VerifyCheckmark isLoading={isVerifying} isVerified={isVerified} />

          {children}
        </Grid>
      </CardContent>
    </Card>
  );
}
