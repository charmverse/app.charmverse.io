import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import type { SvgIconProps } from '@mui/material';

import type { PropertyType } from 'lib/focalboard/board';

export const iconForPropertyType = (propertyType: PropertyType, props?: SvgIconProps) => {
  switch (propertyType) {
    case 'checkbox':
      return <CheckBoxOutlinedIcon fontSize='small' {...props} />;
    case 'createdBy':
      return <PersonIcon fontSize='small' {...props} />;
    case 'createdTime':
      return <AccessTimeIcon fontSize='small' {...props} />;
    case 'date':
      return <EventNoteIcon fontSize='small' {...props} />;
    case 'email':
      return <AlternateEmailIcon fontSize='small' {...props} />;
    case 'file':
      return <AttachFileIcon fontSize='small' {...props} />;
    case 'multiSelect':
      return <ListIcon fontSize='small' {...props} />;
    case 'proposalEvaluationAverage':
    case 'proposalEvaluationTotal':
    case 'number':
    case 'tokenAmount':
      return <NumbersIcon fontSize='small' {...props} />;
    case 'person':
    case 'proposalEvaluatedBy':
      return <PersonIcon fontSize='small' {...props} />;
    case 'phone':
      return <PhoneIcon fontSize='small' {...props} />;
    case 'proposalStep':
    case 'proposalStatus':
    case 'proposalEvaluationType':
    case 'select':
      return <FormatListBulletedIcon fontSize='small' {...props} />;
    case 'text':
    case 'tokenChain':
      return <SubjectIcon fontSize='small' {...props} />;
    case 'updatedBy':
    case 'proposalReviewer':
    case 'proposalAuthor':
      return <PersonIcon fontSize='small' {...props} />;
    case 'updatedTime':
      return <AccessTimeIcon fontSize='small' {...props} />;
    case 'url':
    case 'proposalUrl':
      return <LinkIcon fontSize='small' {...props} />;
    case 'relation':
      return <ArrowOutwardIcon fontSize='small' {...props} />;
    default:
      return null;
  }
};
