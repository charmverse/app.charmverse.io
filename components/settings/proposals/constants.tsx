import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { HowToVoteOutlined } from '@mui/icons-material';
import { SvgIcon, Tooltip } from '@mui/material';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import { RiChatCheckLine } from 'react-icons/ri';

export const evaluateVerbs = {
  rubric: 'Evaluate',
  vote: 'Vote',
  pass_fail: 'Review'
};

export const evaluationIcons = {
  [ProposalEvaluationType.vote]: (
    <Tooltip title='Vote'>
      <HowToVoteOutlined color='secondary' fontSize='small' />
    </Tooltip>
  ),
  [ProposalEvaluationType.rubric]: (
    <Tooltip title='Rubric'>
      <span>
        <SvgIcon component={RiChatCheckLine} color='secondary' fontSize='small' />
      </span>
    </Tooltip>
  ),
  [ProposalEvaluationType.pass_fail]: (
    <Tooltip title='Pass / Fail'>
      <span>
        <SvgIcon component={MdOutlineThumbsUpDown} color='secondary' fontSize='small' />
      </span>
    </Tooltip>
  )
};
