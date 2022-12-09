import { HowToVoteOutlined } from '@mui/icons-material';

import { RowDecoration } from '../../inlineComment/components/InlineCommentRowDecoration';

export default function RowIcon({ count }: { count: number }) {
  return <RowDecoration count={count} icon={HowToVoteOutlined} />;
}
