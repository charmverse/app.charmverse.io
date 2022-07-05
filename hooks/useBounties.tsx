import { Bounty } from '@prisma/client';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import useRefState from 'hooks/useRefState';
import { UpdateableBountyFields } from 'lib/bounties/interfaces';
import { useUser } from './useUser';
import { BountyWithDetails } from '../models';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = {
  bounties: BountyWithDetails[],
  setBounties: Dispatch<SetStateAction<BountyWithDetails[]>>,
  currentBountyId: string | null,
  updateCurrentBountyId: (bountyId: string | null) => void,
  currentBounty: BountyWithDetails | null
  setCurrentBounty: (bounty: BountyWithDetails) => void,
  updateBounty: (bountyId: string, update: Partial<Bounty>) => Promise<BountyWithDetails>
  deleteBounty: (bountyId: string) => Promise<true>
  refreshBounty: (bountyId: string) => Promise<void>
};

export const BountiesContext = createContext<Readonly<IContext>>({
  bounties: [],
  setBounties: () => undefined,
  currentBountyId: null,
  updateCurrentBountyId: () => undefined,
  currentBounty: null,
  setCurrentBounty: () => undefined,
  updateBounty: () => Promise.resolve({} as any),
  deleteBounty: () => Promise.resolve(true),
  refreshBounty: () => Promise.resolve(undefined)
});

export function BountiesProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();

  // Hardcoded for now - remove after dev is complete
  const spaceId = '5376c50b-50f2-4227-a09d-2eb32dfd7e78';

  const [user] = useUser();
  const [bounties, bountiesRef, setBounties] = useRefState<BountyWithDetails[]>([]);
  useEffect(() => {
    if (space) {
      setBounties([]);
      charmClient.listBounties(spaceId)
        .then(_bounties => {
          setBounties(_bounties);
        });
    // Remove this after dev
    }
    else {
      charmClient.listBounties(spaceId)
        .then(_bounties => {
          setBounties(_bounties);
        });
    }
  }, [user?.id, spaceId]);

  const [currentBountyId, setCurrentBountyId] = useState<string | null>(null);

  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails | null>(null);

  // Updates the value of a bounty in the bounty list
  function refreshBountyList (bounty: BountyWithDetails) {
    setBounties(_bounties => {
      const bountyIndex = _bounties.findIndex(bountyInList => bountyInList.id === bounty.id);

      const updatedList = _bounties.slice();

      if (bountyIndex > -1) {
        updatedList[bountyIndex] = bounty;
      }
      else {
        updatedList.push(bounty);
      }
      return updatedList;
    });
  }

  async function updateBounty (bountyId: string, bountyUpdate: UpdateableBountyFields) {

    const updatedBounty = await charmClient.updateBounty({ bountyId, updateContent: bountyUpdate });

    refreshBountyList(updatedBounty);

    if (currentBounty?.id === updatedBounty.id) {
      setCurrentBounty(updatedBounty);
    }

    return updatedBounty;
  }

  async function updateCurrentBountyId (id: string | null) {
    setCurrentBountyId(id);

    if (id) {
      const bountyFromCache = bountiesRef.current.find(b => b.id === id);
      if (bountyFromCache) {
        setCurrentBounty(bountyFromCache);
      }
      // get latest state just in case
      const refreshed = await charmClient.getBounty(id);
      refreshBountyList(refreshed);
      setCurrentBounty(refreshed);
    }
    else {
      setCurrentBounty(null);
    }
  }

  async function deleteBounty (bountyId: string): Promise<true> {
    await charmClient.deleteBounty(bountyId);
    setBounties(_bounties => _bounties.filter(bounty => bounty.id !== bountyId));
    if (currentBounty?.id === bountyId) {
      setCurrentBounty(null);
    }
    return true;
  }

  async function refreshBounty (bountyId: string) {
    const refreshed = await charmClient.getBounty(bountyId);
    if (currentBounty?.id === bountyId) {
      setCurrentBounty(refreshed);
    }
    refreshBountyList(refreshed);
  }

  function _setCurrentBounty (bountyToSet: BountyWithDetails | null) {

    setCurrentBounty(bountyToSet);

    if (bountyToSet) {
      // Replace current bounty in list of bounties
      setBounties(_bounties => _bounties.map(b => b.id === bountyToSet.id ? bountyToSet : b));
    }

  }

  const value = useMemo(() => ({
    bounties,
    setBounties,
    currentBountyId,
    updateCurrentBountyId,
    currentBounty,
    setCurrentBounty: _setCurrentBounty,
    updateBounty,
    deleteBounty,
    refreshBounty
  }), [bounties, currentBountyId, currentBounty]);

  return (
    <BountiesContext.Provider value={value}>
      {children}
    </BountiesContext.Provider>
  );
}

export const useBounties = () => useContext(BountiesContext);
