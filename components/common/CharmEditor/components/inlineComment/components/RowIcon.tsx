
import { Box, Typography } from '@mui/material';
import { CommentOutlined } from '@mui/icons-material';

export default function RowIcon ({ threadIds }: { threadIds: string[] }) {
  return (
    <Box
      display='flex'
      gap={0.5}
      alignItems='center'

    >
      <CommentOutlined
        color='secondary'
        fontSize='small'
      />
      <Typography
        component='span'
        variant='subtitle1'
      >
        {threadIds.length}
      </Typography>
    </Box>
  );
}
