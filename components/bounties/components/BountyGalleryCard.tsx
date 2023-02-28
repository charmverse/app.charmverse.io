import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Bounty } from '@prisma/client';
import { FormattedMessage } from 'react-intl';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { PageActions } from 'components/common/PageActions';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { usePageDetails } from 'hooks/usePageDetails';
import type { PageMeta } from 'lib/pages';
import { fancyTrim } from 'lib/utilities/strings';

import BountyStatusBadge from './BountyStatusBadge';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })};

  border: none;
  background-color: var(--background-paper);
  transition: background 100ms ease-out 0s;

  @media (pointer: fine) {
    &:hover {
      background-color: rgba(var(--center-channel-color-rgb), 0.1);
    }
  }
`;

interface Props {
  onDelete: (bountyId: string) => void;
  onClick: () => void;
  readOnly?: boolean;
  bounty: Bounty;
  page: PageMeta;
}

export function BountyGalleryCard({ page: bountyPage, bounty, readOnly, onClick, onDelete }: Props) {
  const { pageDetails } = usePageDetails(bountyPage?.id);

  return bountyPage ? (
    <StyledBox
      onClick={onClick}
      className='GalleryCard'
      sx={{
        height: 'fit-content',
        display: 'grid' // make child full height,
      }}
      data-test={`bounty-card-${bounty.id}`}
    >
      {!readOnly && <PageActions page={bountyPage} onClickDelete={() => onDelete(bounty.id)} />}
      <div className='gallery-title'>
        {bountyPage?.icon ? (
          <PageIcon isEditorEmpty={!bountyPage?.hasContent} pageType='card' icon={bountyPage.icon} />
        ) : undefined}
        <div key='__title'>
          {bountyPage?.title || <FormattedMessage id='GalleryCard.untitled' defaultMessage='Untitled' />}
        </div>
      </div>
      <Box width='100%' display='flex' flex={1} flexDirection='column' px={1} mb={1} justifyContent='space-between'>
        <Typography paragraph={true}>{fancyTrim(pageDetails?.contentText, 50)}</Typography>
        <BountyStatusBadge bounty={bounty} truncate />
      </Box>
    </StyledBox>
  ) : null;
}
