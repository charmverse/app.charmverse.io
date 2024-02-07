import { Box } from '@mui/material';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  createdAt: number;
  wrapColumn?: boolean;
  centerContent?: boolean;
};

function CreatedAt(props: Props): JSX.Element {
  const { formatDateTime } = useDateFormatter();
  return (
    <Box
      display='flex'
      height='100%'
      className='octo-propertyvalue readonly'
      alignItems={props.centerContent ? 'center' : 'flex-start'}
      sx={{ whiteSpace: props.wrapColumn ? 'break-spaces' : 'nowrap' }}
    >
      {formatDateTime(new Date(props.createdAt))}
    </Box>
  );
}

export default CreatedAt;
