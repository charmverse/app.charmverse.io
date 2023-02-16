import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import Avatar from 'components/common/Avatar';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';
import { isTouchScreen } from 'lib/utilities/browser';

import { MemberPropertiesRenderer } from './MemberPropertiesRenderer';

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
      sx={{
        boxShadow: 'none',
        borderBottom: (theme) => ` 1px solid ${theme.palette.divider}`,
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        '&:before': { backgroundColor: 'transparent' },
        '& .MuiAccordionSummary-root': { p: 0 },
        '& .MuiAccordionDetails-root': { px: 0 }
      }}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Avatar className='hidden-on-visible' avatar={spaceImage} name={spaceName} variant='rounded' size='large' />
        <Box
          display='flex'
          flex='0 1 auto'
          alignItems='center'
          justifyContent='space-between'
          sx={{ wordBreak: 'break-word' }}
        >
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
        <MemberPropertiesRenderer properties={properties} />
      </AccordionDetails>
    </Accordion>
  );
}
