import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EnterpriseIcon from 'public/images/subscriptions/enterprise.svg';

import Legend from '../../components/Legend';

export function EnterpriseBillingScreen() {
  return (
    <Box>
      <Legend>Billing</Legend>
      <Typography variant='h6' mb={2}>
        Grant Edition
      </Typography>
      <Stack display='flex' flexDirection='row' alignItems='center' gap={5}>
        <Stack>
          <EnterpriseIcon width='90px' height='90px' />
        </Stack>
        <Stack>
          <Typography
            variant='body2'
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            You are on our Grants plan. For any queries related to billing, please reach out to your billing contact at
            CharmVerse
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
