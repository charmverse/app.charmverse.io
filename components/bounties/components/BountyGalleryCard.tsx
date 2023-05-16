import type { Bounty } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { FormattedMessage } from 'react-intl';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { KanbanPageActionsMenuButton } from 'components/common/PageActions/KanbanPageActionButton';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { usePage } from 'hooks/usePage';
import type { PageMeta } from 'lib/pages';
import { fancyTrim } from 'lib/utilities/strings';

import BountyStatusBadge from './BountyStatusBadge';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true })};

  border: none;
  background-color: var(--background-paper);
  transition: background 100ms ease-out 0s;
  box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px;

  .gallery-title {
    border: none;
  }

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
  const { page } = usePage({ pageIdOrPath: bountyPage?.id });

  return bountyPage ? (
    <StyledBox onClick={onClick} className='GalleryCard' data-test={`bounty-card-${bounty.id}`}>
      {!readOnly && <KanbanPageActionsMenuButton page={bountyPage} onClickDelete={() => onDelete(bounty.id)} />}
      <div className='gallery-title'>
        {bountyPage?.icon ? (
          <PageIcon isEditorEmpty={!bountyPage?.hasContent} pageType='card' icon={bountyPage.icon} />
        ) : undefined}
        <div key='__title'>
          {bountyPage?.title || <FormattedMessage id='GalleryCard.untitled' defaultMessage='Untitled' />}
        </div>
      </div>
      <Box
        minWidth='0'
        width='100%'
        display='flex'
        flex={1}
        flexDirection='column'
        px={1}
        mb={1}
        justifyContent='space-between'
      >
        <Typography paragraph={true} noWrap>
          {fancyTrim(page?.contentText, 50)}
        </Typography>
        <BountyStatusBadge bounty={bounty} truncate />
      </Box>
    </StyledBox>
  ) : null;
}
