import Box from '@mui/material/Box';
import BountySuggestionApproval from 'components/bounties/components/BountySuggestionApproval';
import { BountyApplicantList } from 'components/bounties/[bountyId]/components/BountyApplicantList';
import BountyDescription from 'components/bounties/[bountyId]/components_v3/BountyDescription';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import BountySubmissions from 'components/bounties/[bountyId]/components_v3/BountySubmissions';
import { useBounties } from 'hooks/useBounties';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { usePageTitle } from 'hooks/usePageTitle';
import { useEffect, useState } from 'react';
import charmClient from 'charmClient';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { BountyWithDetails } from 'models';

interface BountyDetailsProps {
  bounty?: BountyWithDetails
  centeredContent?: boolean
  showDescription?: boolean
  showHeader?: boolean
}

export default function BountyDetails ({ showHeader = true, showDescription = true, centeredContent = true, bounty }: BountyDetailsProps) {

  const [, setPageTitle] = usePageTitle();
  const { currentBounty, setCurrentBounty, currentBountyId, updateCurrentBountyId } = useBounties();

  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);

  useEffect(() => {
    if (bounty) {
      updateCurrentBountyId(bounty.id);
      setCurrentBounty(bounty);
    }
  }, [bounty]);

  useEffect(() => {
    if (currentBounty) {
      setPageTitle(currentBounty.page?.title ?? 'Untitled bounty');
    }

  }, [currentBounty?.page?.title, bountyPermissions]);

  async function refreshBountyPermissions (bountyId: string) {
    setBountyPermissions(null);
    charmClient.computeBountyPermissions({
      resourceId: bountyId
    }).then(data => setBountyPermissions(data));
  }

  useEffect(() => {

    if (currentBountyId) {
      refreshBountyPermissions(currentBountyId);
    }

  }, [currentBountyId]);

  if (!currentBounty || currentBounty?.id !== currentBountyId) {
    return null;
  }

  const content = !bountyPermissions ? (
    <LoadingComponent height='200px' isLoading={true} />
  ) : (
    <>
      {showHeader && (
      <BountyHeader
        bounty={currentBounty}
        permissions={bountyPermissions}
        refreshBountyPermissions={() => {
          // refreshBounty(currentBountyId);
          refreshBountyPermissions(currentBountyId);
        }}
      />
      )}

      {showDescription && <BountyDescription bounty={currentBounty} permissions={bountyPermissions} />}

      {
      currentBounty.status === 'suggestion' && <BountySuggestionApproval bounty={currentBounty} />
    }

      {
      currentBounty.status !== 'suggestion' && (
        <>
          <Box sx={{ mb: 3 }}>
            <BountySubmissions bounty={currentBounty} permissions={bountyPermissions} />
          </Box>
          {
            currentBounty.approveSubmitters === true && (
              <BountyApplicantList
                bounty={currentBounty}
                applications={currentBounty.applications}
                permissions={bountyPermissions}
              />
            )
          }
        </>
      )
    }
    </>
  );

  return centeredContent
    ? (
      <CenteredPageContent>
        {content}
      </CenteredPageContent>
    ) : content;
}

