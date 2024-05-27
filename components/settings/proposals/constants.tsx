import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { FeedbackOutlined, HowToVoteOutlined } from '@mui/icons-material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import type { SvgIconProps } from '@mui/material';
import { SvgIcon, Tooltip } from '@mui/material';
import { forwardRef } from 'react';
import { MdOutlineThumbsUpDown } from 'react-icons/md';
import { RiChatCheckLine } from 'react-icons/ri';

// wrap SVGIcon with forwardRef so that it can work with tooltips w/o an extra span tag
// source: https://stackoverflow.com/questions/57527896/material-ui-tooltip-doesnt-display-on-custom-component-despite-spreading-props
const SvgIconWithRef = forwardRef<SVGSVGElement | null, SvgIconProps>((props, ref) => <SvgIcon ref={ref} {...props} />);

const defaultProps: SvgIconProps = {
  color: 'secondary',
  fontSize: 'small'
};

export const evaluationIcons = {
  [ProposalEvaluationType.feedback]: (props: SvgIconProps = {}) => (
    <Tooltip title='Feedback'>
      <FeedbackOutlined {...defaultProps} {...props} />
    </Tooltip>
  ),
  [ProposalEvaluationType.vote]: (props: SvgIconProps = {}) => (
    <Tooltip title='Vote'>
      <HowToVoteOutlined {...defaultProps} {...props} />
    </Tooltip>
  ),
  [ProposalEvaluationType.rubric]: (props: SvgIconProps = {}) => (
    <Tooltip title='Rubric'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <RiChatCheckLine />
      </SvgIconWithRef>
    </Tooltip>
  ),
  [ProposalEvaluationType.pass_fail]: (props: SvgIconProps = {}) => (
    <Tooltip title='Pass / Fail'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <MdOutlineThumbsUpDown />
      </SvgIconWithRef>
    </Tooltip>
  ),
  [ProposalEvaluationType.sign_documents]: (props: SvgIconProps = {}) => (
    <Tooltip title='Sign Documents'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <EditNoteOutlinedIcon />
      </SvgIconWithRef>
    </Tooltip>
  ),
  private_evaluation: (props: SvgIconProps = {}) => (
    <Tooltip title='Evaluation'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <MdOutlineThumbsUpDown />
      </SvgIconWithRef>
    </Tooltip>
  ),
  draft: (props: SvgIconProps = {}) => (
    <Tooltip title='Draft'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <ModeEditOutlineOutlinedIcon />
      </SvgIconWithRef>
    </Tooltip>
  ),
  rewards: (props: SvgIconProps = {}) => (
    <Tooltip title='Rewards'>
      <SvgIconWithRef inheritViewBox {...defaultProps} {...props}>
        <BountyIcon />
      </SvgIconWithRef>
    </Tooltip>
  )
};
