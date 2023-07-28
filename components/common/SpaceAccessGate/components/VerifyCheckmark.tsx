import CancelIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Grid } from '@mui/material';

import LoadingComponent from 'components/common/LoadingComponent';

type Props = {
  isLoading?: boolean;
  isVerified?: boolean | null;
};

export function VerifyCheckmark({ isLoading, isVerified }: Props) {
  return (
    <Grid item xs={2} display='flex' justifyContent='center' alignItems='center'>
      {isLoading && <LoadingComponent isLoading height='20px' size={25} />}
      {!isLoading && isVerified && <CheckCircleIcon color='success' />}
      {!isLoading && isVerified === false && <CancelIcon color='error' />}
    </Grid>
  );
}
