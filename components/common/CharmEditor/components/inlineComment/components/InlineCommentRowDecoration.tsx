
import { Box, Typography } from '@mui/material';
import { CommentOutlined } from '@mui/icons-material';

export function RowDecoration ({ count, icon: Icon }: { count: number, icon: any }) {
  return (
    <Box
      display='flex'
      gap={0.5}
      alignItems='center'
      sx={{ cursor: 'pointer' }}
    >
      <Icon
        color='secondary'
        fontSize='small'
      />
      <Typography
        component='span'
        variant='subtitle1'
      >
        {count}
      </Typography>
    </Box>
  );
}

export default function RowIcon ({ count }: { count: number }) {
  return <RowDecoration icon={CommentOutlined} count={count} />;
}
