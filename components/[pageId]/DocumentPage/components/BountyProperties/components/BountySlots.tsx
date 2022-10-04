import { Box, Chip } from '@mui/material';

import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { conditionalPlural } from 'lib/utilities/strings';

interface BountyReviewersProps {
  maxSubmissions: number;
  validSubmissions: number;
}

export default function BountySlots ({ maxSubmissions, validSubmissions }: BountyReviewersProps) {

  const remainingSlots = maxSubmissions - validSubmissions;

  return (
    <Box display='flex' alignItems='center' gap={2}>
      <div className='octo-propertyname octo-propertyname--readonly'>
        <Button>Submission limit</Button>
      </div>

      <Box display='flex' alignItems='center'>
        {
          remainingSlots <= 0 ? (
            <Chip size='medium' sx={{ fontWeight: 'bold' }} label='FULL' variant='outlined' color='error' />
          ) : (
            <Chip size='medium' sx={{ fontWeight: 'bold' }} label={`${remainingSlots} ${conditionalPlural({ word: 'spot', count: remainingSlots })} left`} variant='outlined' color='primary' />
          )
        }
      </Box>

    </Box>
  );
}
