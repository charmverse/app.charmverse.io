import { styled, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { staticSpaceTemplates } from '@packages/spaces/config';
import type { SpaceTemplateType } from '@packages/spaces/config';
import { AiOutlineFileMarkdown } from 'react-icons/ai';
import { SiNotion } from 'react-icons/si';

import { TemplateIcon, CreateMyOwnIcon } from './TemplateIcon';
import { TemplateOption } from './TemplateOption';

type SelectNewSpaceTemplateProps = {
  onSelect: (value: SpaceTemplateType) => void;
};

const ScrollContainer = styled('div')`
  overflow: auto;
  max-height: 40vh;

  // account for padding from the scrollbar
  padding: 0 32px 20px;
  margin: 0 -32px;
`;

export function SelectNewSpaceTemplate({ onSelect }: SelectNewSpaceTemplateProps) {
  return (
    <ScrollContainer className='space-templates-container'>
      <Grid container spacing={2} flexDirection='column'>
        <Grid>
          <TemplateOption
            onClick={() => onSelect('default')}
            label='Create my own'
            data-test='space-template-default'
            icon={<CreateMyOwnIcon />}
          />
        </Grid>
        <Grid>
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Start from a template
          </Typography>
        </Grid>

        {staticSpaceTemplates.map((template) => (
          <Grid key={template.id}>
            <TemplateOption
              data-test={`space-template-${template}`}
              onClick={() => onSelect(template.id)}
              label={template.name}
              icon={<TemplateIcon template={template.id} />}
            />
          </Grid>
        ))}
        <Grid>
          <Divider flexItem sx={{ mb: 2 }} />
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Transfer from another platform
          </Typography>
        </Grid>
        <Grid>
          <TemplateOption
            data-test='space-template-importNotion'
            onClick={() => onSelect('importNotion')}
            label='Import from Notion'
            icon={<SiNotion color='var(--primary-text)' style={{ height: 36 }} />}
          />
        </Grid>

        <Grid>
          <TemplateOption
            data-test='space-template-importMarkdown'
            onClick={() => onSelect('importMarkdown')}
            label='Import from Markdown'
            icon={<AiOutlineFileMarkdown color='var(--primary-text)' style={{ height: 40 }} />}
          />
        </Grid>
      </Grid>
    </ScrollContainer>
  );
}
