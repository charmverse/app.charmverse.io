import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { FeedbackOutlined, HowToVoteOutlined } from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';
import { SvgIcon, Tooltip } from '@mui/material';
import { forwardRef } from 'react';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import { RiChatCheckLine } from 'react-icons/ri';

export const evaluateVerbs = {
  [ProposalEvaluationType.feedback]: 'Feedback',
  [ProposalEvaluationType.vote]: 'Vote',
  [ProposalEvaluationType.rubric]: 'Evaluate',
  [ProposalEvaluationType.pass_fail]: 'Review'
};

// wrap SVGIcon with forwardRef so that it can work with tooltips w/o an extra span tag
// source: https://stackoverflow.com/questions/57527896/material-ui-tooltip-doesnt-display-on-custom-component-despite-spreading-props
const SvgIconWithRef = forwardRef<SVGSVGElement | null, SvgIconProps>((props, ref) => <SvgIcon ref={ref} {...props} />);

export const evaluationIcons = {
  [ProposalEvaluationType.feedback]: (
    <Tooltip title='Feedback'>
      <FeedbackOutlined color='secondary' fontSize='small' />
    </Tooltip>
  ),
  [ProposalEvaluationType.vote]: (
    <Tooltip title='Vote'>
      <HowToVoteOutlined color='secondary' fontSize='small' />
    </Tooltip>
  ),
  [ProposalEvaluationType.rubric]: (
    <Tooltip title='Rubric'>
      <SvgIconWithRef inheritViewBox color='secondary' fontSize='small'>
        <RiChatCheckLine />
      </SvgIconWithRef>
    </Tooltip>
  ),
  [ProposalEvaluationType.pass_fail]: (
    <Tooltip title='Pass / Fail'>
      <SvgIconWithRef inheritViewBox color='secondary' fontSize='small'>
        <MdOutlineThumbsUpDown />
      </SvgIconWithRef>
    </Tooltip>
  )
};
