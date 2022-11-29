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
import { humanFriendlyDate } from 'lib/utilities/dates';

type Props = {
  spaceName: string;
  properties: PropertyValueWithDetails[];
  spaceImage: string | null;
  readOnly?: boolean;
  onEdit: VoidFunction;
  expanded?: boolean;
};

const StyledAccordionSummary = styled(AccordionSummary)`
  ${!isTouchScreen() && hoverIconsStyle()}
`;

export function SpaceDetailsAccordion({
  spaceName,
  properties,
  spaceImage,
  readOnly,
  onEdit,
  expanded: defaultExpanded = false
}: Props) {
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
        <WorkspaceAvatar name={spaceName} image={spaceImage} />
        <Box display='flex' flex={1} alignItems='center' justifyContent='space-between'>
          <Typography ml={2} variant='h6'>
            {spaceName}
          </Typography>
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
          {properties.map((property) => {
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
                  property.value && (
                    <Stack key={property.memberPropertyId}>
                      <Typography fontWeight='bold'>{property.name}</Typography>
                      <Typography
                        sx={{
                          wordBreak: 'break-word'
                        }}
                        whiteSpace={property.type === 'text_multiline' ? 'pre-wrap' : 'initial'}
                      >
                        {property.value}
                      </Typography>
                    </Stack>
                  )
                );
              }
              case 'multiselect':
              case 'select': {
                const propertyValue = property.value as string | undefined | string[];
                if (!propertyValue || propertyValue?.length === 0) {
                  return null;
                }
                return <SelectPreview value={propertyValue} name={property.name} options={property.options} />;
              }
              case 'join_date': {
                return (
                  <Stack key={property.memberPropertyId}>
                    <Typography fontWeight='bold'>{property.name}</Typography>
                    <Typography>
                      {humanFriendlyDate(property.value as string, {
                        withYear: true
                      })}
                    </Typography>
                  </Stack>
                );
              }
              case 'role': {
                const roles = property.value as string[];
                return (
                  roles.length !== 0 && (
                    <Stack key={property.memberPropertyId}>
                      <Typography fontWeight='bold'>{property.name}</Typography>
                      <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                        {roles.map((role) => (
                          <Chip label={role} key={role} size='small' variant='outlined' />
                        ))}
                      </Stack>
                    </Stack>
                  )
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
