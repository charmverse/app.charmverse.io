import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import type { SvgIconProps } from '@mui/material';

import type { PropertyType } from 'lib/focalboard/board';

export const iconForPropertyType = (propertyType: PropertyType, props?: SvgIconProps) => {
  switch (propertyType) {
    case 'checkbox':
      return <ToggleOnOutlinedIcon fontSize='small' {...props} />;
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
      return <NumbersIcon fontSize='small' {...props} />;
    case 'person':
    case 'proposalEvaluatedBy':
      return <PersonIcon fontSize='small' {...props} />;
    case 'phone':
      return <PhoneIcon fontSize='small' {...props} />;
    case 'proposalCategory':
    case 'proposalStatus':
    case 'select':
      return <FormatListBulletedIcon fontSize='small' {...props} />;
    case 'text':
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
    default:
      return null;
  }
};
