import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { useSmallScreen } from 'hooks/useMediaScreens';

import Legend from '../../Legend';

export function EnterpriseBillingScreen() {
  const isSmallScreen = useSmallScreen();

  const logoSize = isSmallScreen ? 50 : 100;

  return (
    <Box>
      <Legend whiteSpace='normal'>Plan & Billing</Legend>
      <Grid container spacing={5} alignItems='center'>
        <Grid item xs={12} sm={8} display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
          <Typography>Enterprise Edition</Typography>
        </Grid>
        <Grid container item>
          <Grid item xs={2}>
            <Image
              width={logoSize}
              height={logoSize}
              style={{ maxWidth: logoSize, maxHeight: logoSize }}
              src='/images/paidtiers/enterprise.png'
              alt='charmverse enterprise plan logo'
            />
          </Grid>
          <Grid item xs={10}>
            <Typography
              variant='body2'
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              mb={1}
            >
              You are on our Enteprise plan. For any queries related to billing, please reach out to your billing
              contact at CharmVerse
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
