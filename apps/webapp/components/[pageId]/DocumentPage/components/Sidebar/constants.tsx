import { MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { SvgIcon } from '@mui/material';
import { RiChatCheckLine } from 'react-icons/ri';

export const SIDEBAR_VIEWS = {
  proposal_evaluation: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'View evaluations',
    title: 'Evaluations'
  },
  reward_evaluation: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'View evaluations',
    title: 'Evaluations'
  },
  comments: {
    icon: <MessageOutlined fontSize='small' />,
    tooltip: 'View all comments',
    title: 'Comments'
  },
  suggestions: {
    icon: <RateReviewOutlined fontSize='small' />,
    tooltip: 'View all suggestions',
    title: 'Suggestions'
  }
} as const;
