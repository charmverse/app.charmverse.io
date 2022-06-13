import Box from '@mui/material/Box';
import BountySuggestionApproval from 'components/bounties/components/BountySuggestionApproval';
import { BountyApplicantList } from 'components/bounties/[bountyId]/components/BountyApplicantList';
import BountyDescription from 'components/bounties/[bountyId]/components_v3/BountyDescription';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import BountySubmissions from 'components/bounties/[bountyId]/components_v3/BountySubmissions';
import { useBounties } from 'hooks/useBounties';
import { usePageTitle } from 'hooks/usePageTitle';
import { useEffect } from 'react';

export default function BountyDetails () {

  const [, setPageTitle] = usePageTitle();
  const { currentBounty, currentBountyId } = useBounties();

  useEffect(() => {
    const bountyTitle = currentBounty?.title;

    if (bountyTitle) {
      setPageTitle(bountyTitle);
    }

  }, [currentBounty?.title]);

  if (!currentBounty || currentBounty?.id !== currentBountyId) {
    return null;
  }

  return (
    <Box py={3} px={18}>

      <BountyHeader bounty={currentBounty} />

      <BountyDescription />

      {
          currentBounty.status === 'suggestion' && <BountySuggestionApproval bounty={currentBounty} />
        }

      {
          currentBounty.status !== 'suggestion' && (
            <>
              <Box sx={{ mb: 3 }}>
                <BountySubmissions bounty={currentBounty} />

              </Box>
              {
          currentBounty.approveSubmitters === true && (
          <BountyApplicantList
            bounty={currentBounty}
            applications={currentBounty.applications}
          />
          )
        }
            </>
          )
        }
    </Box>
  );

}

