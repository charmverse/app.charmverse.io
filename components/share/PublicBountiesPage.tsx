
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import BountiesPage from 'components/bounties/BountiesPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';

export default function PublicBountiesPage () {

  const space = useCurrentSpace();

  const [bounties, setBounties] = useState<BountyWithDetails[] | null>(null);

  useEffect(() => {
    if (space) {
      charmClient.bounties.listBounties(space.id, true)
        .then(_bounties => {
          setBounties(_bounties);
        });
    }
  }, [space?.id]);

  if (!space || !bounties) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (
    space.publicBountyBoard
      ? <BountiesPage publicMode bounties={bounties} />
      : <ErrorPage message={"Sorry, this workspace's bounties are reserved to its members."} />
  );
}
