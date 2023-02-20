import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { MdOutlineBuild } from 'react-icons/md';
import { SiNotion } from 'react-icons/si';
import { SlBadge } from 'react-icons/sl';

import { spaceContentTemplates } from 'lib/spaces/config';
import type { SpaceCreateTemplate, SpaceTemplate } from 'lib/spaces/config';
import { typedKeys } from 'lib/utilities/objects';

import iconButton from '../BoardEditor/focalboard/src/widgets/buttons/iconButton';

import { TemplateOption } from './TemplateOption';

type SelectNewSpaceTemplateProps = {
  onSelect: (value: SpaceCreateTemplate) => void;
};

const fontSize = 24;

const templateIcon: Record<SpaceTemplate, React.ReactNode> = {
  templateCreator: <EmojiObjectsIcon htmlColor='var(--secondary-text)' sx={{ fontSize }} />,
  templateNftCommunity: <SlBadge color='var(--secondary-text)' size={fontSize} />
};

export function SelectNewSpaceTemplate({ onSelect }: SelectNewSpaceTemplateProps) {
  return (
    <Grid container spacing={2} flexDirection='column'>
      <Grid item>
        <TemplateOption
          onClick={() => onSelect('default')}
          label='Create my own'
          data-test='space-template-default'
          icon={<MdOutlineBuild color='var(--secondary-text)' size={fontSize} />}
        />
      </Grid>
      <Grid item>
        <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
          Start from a template
        </Typography>
      </Grid>

      {typedKeys(spaceContentTemplates).map((template) => (
        <Grid item key={template}>
          <TemplateOption
            data-test={`space-template-${template}`}
            onClick={() => onSelect(template)}
            label={spaceContentTemplates[template]}
            icon={templateIcon[template]}
          />
        </Grid>
      ))}
      <Grid item>
        <Divider flexItem sx={{ mb: 2 }} />
        <TemplateOption
          data-test='space-template-importNotion'
          onClick={() => onSelect('importNotion')}
          label='Import from Notion'
          icon={<SiNotion color='var(--secondary-text)' size={fontSize} />}
        />
      </Grid>

      <Grid item>
        <TemplateOption
          data-test='space-template-importMarkdown'
          onClick={() => onSelect('importMarkdown')}
          label='Import from Markdown'
          icon={<DriveFolderUploadIcon color='secondary' sx={{ fontSize }} />}
        />
      </Grid>
    </Grid>
  );
}
