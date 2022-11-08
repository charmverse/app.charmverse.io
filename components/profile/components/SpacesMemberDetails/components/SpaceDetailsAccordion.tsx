import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/WorkspaceAvatar';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';
import { isTouchScreen } from 'lib/utilities/browser';

type Props = {
  spaceName: string;
  properties: PropertyValueWithDetails[];
  spaceImage: string | null;
  readOnly?: boolean;
  onEdit: VoidFunction;
  expanded?: boolean;
};

const StyledAccordionSummary = styled(AccordionSummary)`
  ${({ theme }) => !isTouchScreen() && hoverIconsStyle({ theme, isTouchScreen: isTouchScreen() })}
`;

export function SpaceDetailsAccordion ({ spaceName, properties, spaceImage, readOnly, onEdit, expanded: defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const touchScreen = isTouchScreen();
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => {
        setExpanded(!expanded);
      }}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <WorkspaceAvatar
          name={spaceName}
          image={spaceImage}
        />
        <Box display='flex' flex={1} alignItems='center' justifyContent='space-between'>
          <Typography ml={2} variant='h6'>{spaceName}</Typography>
          {!readOnly && (
            <IconButton
              className='icons'
              sx={{ mx: 1, opacity: touchScreen ? (expanded ? 1 : 0) : 'inherit' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </Box>
      </StyledAccordionSummary>
      <AccordionDetails>
        <Stack gap={2}>
          {properties.map(property => {
            if (!property.enabledViews.includes('profile')) {
              return null;
            }
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
                return (
                  <SelectPreview
                    value={property.value as (string | string[])}
                    name={property.name}
                    options={property.options}
                  />
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
