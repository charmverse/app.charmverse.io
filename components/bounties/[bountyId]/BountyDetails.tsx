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

export default function BountyDetails () {

  const [, setPageTitle] = usePageTitle();
  const { currentBounty, currentBountyId } = useBounties();

  const [bountyPermissions, setBountyPermissions] = useState<AssignedBountyPermissions | null>(null);

  useEffect(() => {
    if (currentBounty) {
      setPageTitle(currentBounty.title ?? 'Untitled bounty');
    }

  }, [currentBounty?.title, bountyPermissions]);

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

  return !bountyPermissions ? (
    <LoadingComponent height='200px' isLoading={true} />
  ) : (
    <CenteredPageContent>

      <BountyHeader
        bounty={currentBounty}
        permissions={bountyPermissions}
        refreshBountyPermissions={() => {
          // refreshBounty(currentBountyId);
          refreshBountyPermissions(currentBountyId);
        }}
      />

      <BountyDescription bounty={currentBounty} permissions={bountyPermissions} />

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
    </CenteredPageContent>
  );

}

