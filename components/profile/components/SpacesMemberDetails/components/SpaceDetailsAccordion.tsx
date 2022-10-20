import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, IconButton, Stack, Typography } from '@mui/material';

import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/WorkspaceAvatar';
import type { PropertyOption } from 'components/members/components/MemberDirectoryProperties/MemberPropertySelectInput';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';

type Props = {
  spaceName: string;
  properties: PropertyValueWithDetails[];
  spaceImage: string | null;
  readOnly?: boolean;
  onEdit: VoidFunction;
};

export function SpaceDetailsAccordion ({ spaceName, properties, spaceImage, readOnly, onEdit }: Props) {

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}><WorkspaceAvatar
        name={spaceName}
        image={spaceImage}
      />
        <Box display='flex' flex={1} alignItems='center' justifyContent='space-between'>
          <Typography ml={2} variant='h6'>{spaceName}</Typography>
          {!readOnly && (
            <IconButton
              sx={{ mx: 1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              data-testid='edit-identity'
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack gap={2}>
          {properties.map(property => {
            switch (property.type) {
              case 'text':
              case 'text_multiline':
              case 'phone':
              case 'name':
              case 'url':
              case 'email':
              case 'number': {
                return (
                  <Stack key={property.memberPropertyId}>
                    <Typography fontWeight='bold'>{property.name}</Typography>
                    <Typography whiteSpace={property.type === 'text_multiline' ? 'pre-wrap' : 'initial'}>{property.value ?? 'N/A'}</Typography>
                  </Stack>
                );
              }
              case 'multiselect':
              case 'select': {
                const values = (Array.isArray(property.value) ? property.value : [property.value].filter(Boolean)) as PropertyOption[];
                return (
                  <Stack gap={0.5} key={property.memberPropertyId}>
                    <Typography fontWeight='bold'>{property.name}</Typography>
                    <Stack gap={1} flexDirection='row'>
                      {values.length !== 0 ? values.map(propertyValue => <Chip label={propertyValue.name} color={propertyValue.color} key={propertyValue.name} size='small' variant='outlined' />) : 'N/A'}
                    </Stack>
                  </Stack>
                );
              }

              case 'role': {
                const roles = property.value as string[];
                return (
                  <Stack gap={0.5} key={property.memberPropertyId}>
                    <Typography fontWeight='bold'>{property.name}</Typography>
                    <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                      {roles.length === 0 ? 'N/A' : roles.map(role => <Chip label={role} key={role} size='small' variant='outlined' />)}
                    </Stack>
                  </Stack>
                );
              }
              default: {
                return null;
              }
            }
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
