import Box from '@mui/material/Box';
import BountySuggestionApproval from 'components/bounties/components/BountySuggestionApproval';
import BountyDescription from 'components/bounties/[bountyId]/components_v3/BountyDescription';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { useBounties } from 'hooks/useBounties';
import { usePageTitle } from 'hooks/usePageTitle';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function BountyDetails () {

  const router = useRouter();
  const [_, setPageTitle] = usePageTitle();
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
    <Box py={3} px='80px'>

      <Container top={20}>
        <BountyHeader />

        <BountyDescription />

        {
          currentBounty.status === 'suggestion' && <BountySuggestionApproval bounty={currentBounty} />
        }

      </Container>
    </Box>
  );

}

