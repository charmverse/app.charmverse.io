
import { Box, Typography } from '@mui/material';
import { HowToVoteOutlined } from '@mui/icons-material';
import { RowDecoration } from '../../inlineComment/components/InlineCommentRowDecoration';

export default function RowIcon ({ count }: { count: number; }) {
  return (
    <RowDecoration>
      <HowToVoteOutlined
        color='secondary'
        fontSize='small'
      />
      <Typography
        component='span'
        variant='subtitle1'
      >
        {count}
      </Typography>
    </RowDecoration>
  );
}
