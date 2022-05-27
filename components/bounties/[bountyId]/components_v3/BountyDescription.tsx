import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { usePageTitle } from 'hooks/usePageTitle';
import { useEffect, useState, useMemo } from 'react';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { BountyWithDetails, PageContent } from 'models';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import { useBounties } from 'hooks/useBounties';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';

export default function BountyDescription () {
  const { currentBounty, currentBountyId } = useBounties();

  const CharmEditorMemoized = useMemo(() => {
    // Only show the editor if the description exist
    // Otherwise it shows the `Type / for commands` placeholder
    return currentBounty && currentBounty.description ? (
      <CharmEditor
        readOnly
        key={currentBounty.description}
        content={currentBounty.descriptionNodes as PageContent}
      />
    ) : null;
  }, [currentBounty]);

  return (
    <Box my={2}>
      {CharmEditorMemoized}
    </Box>
  );

}
