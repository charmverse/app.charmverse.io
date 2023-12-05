import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { FeedbackOutlined, HowToVoteOutlined } from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';
import { SvgIcon, Tooltip } from '@mui/material';
import { forwardRef } from 'react';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import { RiChatCheckLine } from 'react-icons/ri';

export const evaluateVerbs = {
  [ProposalEvaluationType.feedback]: 'Review',
  [ProposalEvaluationType.vote]: 'Vote',
  [ProposalEvaluationType.rubric]: 'Evaluate',
  [ProposalEvaluationType.pass_fail]: 'Review'
};

// wrap SVGIcon with forwardRef so that it can work with tooltips w/o an extra span tag
// source: https://stackoverflow.com/questions/57527896/material-ui-tooltip-doesnt-display-on-custom-component-despite-spreading-props
const SvgIconWithRef = forwardRef<SVGSVGElement | null, SvgIconProps>((props, ref) => <SvgIcon ref={ref} {...props} />);

const defaultProps: SvgIconProps = {
  color: 'secondary',
  fontSize: 'small'
};

export const evaluationIcons = {
  [ProposalEvaluationType.feedback]: (props: SvgIconProps = defaultProps) => (
    <Tooltip title='Feedback'>
      <FeedbackOutlined {...props} />
    </Tooltip>
  ),
  [ProposalEvaluationType.vote]: (props: SvgIconProps = defaultProps) => (
    <Tooltip title='Vote'>
      <HowToVoteOutlined {...props} />
    </Tooltip>
  ),
  [ProposalEvaluationType.rubric]: (props: SvgIconProps = defaultProps) => (
    <Tooltip title='Rubric'>
      <SvgIconWithRef inheritViewBox {...props}>
        <RiChatCheckLine />
      </SvgIconWithRef>
    </Tooltip>
  ),
  [ProposalEvaluationType.pass_fail]: (props: SvgIconProps = defaultProps) => (
    <Tooltip title='Pass / Fail'>
      <SvgIconWithRef inheritViewBox {...props}>
        <MdOutlineThumbsUpDown />
      </SvgIconWithRef>
    </Tooltip>
  )
};
