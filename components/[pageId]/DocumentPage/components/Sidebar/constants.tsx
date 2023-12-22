import { MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { SvgIcon } from '@mui/material';
import { RiChatCheckLine } from 'react-icons/ri';

export const SIDEBAR_VIEWS = {
  proposal_evaluation: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'View evaluation',
    title: 'Evaluation'
  },
  proposal_evaluation_settings: {
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
    tooltip: 'Manage reviewers, rubric, and vote options',
    title: 'Evaluation settings'
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
