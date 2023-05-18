import styled from '@emotion/styled';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { Divider, Typography, SvgIcon } from '@mui/material';
import Grid from '@mui/material/Grid';
import { MdOutlineBuild } from 'react-icons/md';
import { SiHackthebox, SiNotion } from 'react-icons/si';
import { SlBadge, SlTrophy } from 'react-icons/sl';
import { TfiWrite } from 'react-icons/tfi';

import { staticSpaceTemplates } from 'lib/spaces/config';
import type { SpaceTemplateType, StaticSpaceTemplateType } from 'lib/spaces/config';
import NounsIcon from 'public/images/logos/noggles/noggles.svg';

import { TemplateOption } from './TemplateOption';

type SelectNewSpaceTemplateProps = {
  onSelect: (value: SpaceTemplateType) => void;
};

const fontSize = 24;

const ScrollContainer = styled.div`
  overflow: auto;
  max-height: 40vh;

  // account for padding from the scrollbar
  padding: 0 32px;
  margin: 0 -32px;
`;

const templateIcon: Record<StaticSpaceTemplateType, React.ReactNode> = {
  templateCreator: <EmojiObjectsIcon htmlColor='var(--primary-color)' sx={{ fontSize }} />,
  templateNftCommunity: <SlBadge color='var(--primary-color)' size={fontSize} />,
  templateHackathon: <SlTrophy color='var(--primary-color)' size={fontSize} />,
  templateNounishDAO: <SvgIcon component={NounsIcon} sx={{ color: 'var(--primary-color)' }} inheritViewBox />,
  templateImpactCommunity: <SiHackthebox color='var(--primary-color)' size={fontSize} />,
  templateGrantRecipient: <TfiWrite color='var(--primary-color)' size={fontSize} />
};

export function SelectNewSpaceTemplate({ onSelect }: SelectNewSpaceTemplateProps) {
  return (
    <ScrollContainer className='space-templates-container'>
      <Grid container spacing={2} flexDirection='column'>
        <Grid item>
          <TemplateOption
            onClick={() => onSelect('default')}
            label='Create my own'
            data-test='space-template-default'
            icon={<MdOutlineBuild color='var(--primary-color)' size={fontSize} />}
          />
        </Grid>
        <Grid item>
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Start from a template
          </Typography>
        </Grid>

        {staticSpaceTemplates.map((template) => (
          <Grid item key={template.id}>
            <TemplateOption
              data-test={`space-template-${template}`}
              onClick={() => onSelect(template.id)}
              label={template.name}
              icon={templateIcon[template.id]}
            />
          </Grid>
        ))}
        <Grid item>
          <Divider flexItem sx={{ mb: 2 }} />
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Transfer from another platform
          </Typography>
        </Grid>
        <Grid item>
          <TemplateOption
            data-test='space-template-importNotion'
            onClick={() => onSelect('importNotion')}
            label='Import from Notion'
            icon={<SiNotion color='var(--primary-color)' size={fontSize} />}
          />
        </Grid>

        <Grid item>
          <TemplateOption
            data-test='space-template-importMarkdown'
            onClick={() => onSelect('importMarkdown')}
            label='Import from Markdown'
            icon={<DriveFolderUploadIcon color='primary' sx={{ fontSize }} />}
          />
        </Grid>
      </Grid>
    </ScrollContainer>
  );
}
