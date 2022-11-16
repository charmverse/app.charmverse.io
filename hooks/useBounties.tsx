import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import useRefState from 'hooks/useRefState';
import type { BountyCreationData, UpdateableBountyFields, BountyWithDetails } from 'lib/bounties';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type IContext = {
  bounties: BountyWithDetails[];
  setBounties: Dispatch<SetStateAction<BountyWithDetails[]>>;
  draftBounty?: BountyCreationData | null;
  createDraftBounty: (data: { pageId: string, spaceId: string, userId: string }) => void;
  cancelDraftBounty: () => void;
  currentBountyId: string | null;
  updateCurrentBountyId: (bountyId: string | null) => void;
  currentBounty: BountyWithDetails | null;
  setCurrentBounty: (bounty: BountyWithDetails) => void;
  updateBounty: (bountyId: string, update: Partial<UpdateableBountyFields>) => Promise<BountyWithDetails>;
  deleteBounty: (bountyId: string) => Promise<true>;
  refreshBounty: (bountyId: string) => Promise<void>;
  loadingBounties: boolean;
};

export const BountiesContext = createContext<Readonly<IContext>>({
  bounties: [],
  setBounties: () => undefined,
  createDraftBounty: () => undefined,
  cancelDraftBounty: () => undefined,
  currentBountyId: null,
  updateCurrentBountyId: () => undefined,
  currentBounty: null,
  setCurrentBounty: () => undefined,
  updateBounty: () => Promise.resolve({} as any),
  deleteBounty: () => Promise.resolve(true),
  refreshBounty: () => Promise.resolve(undefined),
  loadingBounties: false
});

export function BountiesProvider ({ children }: { children: ReactNode }) {
  const space = useCurrentSpace();

  const { user } = useUser();
  const [bounties, bountiesRef, setBounties] = useRefState<BountyWithDetails[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [draftBounty, setDraftBounty] = useState<BountyCreationData | null>(null);

  useEffect(() => {
    if (space?.id) {
      setIsLoading(true);
      setBounties([]);
      charmClient.bounties.listBounties(space?.id)
        .then(_bounties => {
          setBounties(_bounties);
          setIsLoading(false);
        });
    }
  }, [user?.id, space?.id]);

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

    const updatedBounty = await charmClient.bounties.updateBounty({ bountyId, updateContent: bountyUpdate });

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
      const refreshed = await charmClient.bounties.getBounty(id);
      refreshBountyList(refreshed);
      setCurrentBounty(refreshed);
    }
    else {
      setCurrentBounty(null);
    }
  }

  function createDraftBounty ({ pageId, spaceId, userId }: { pageId: string, spaceId: string, userId: string }) {
    setDraftBounty({
      chainId: 1,
      status: 'open',
      spaceId,
      createdBy: userId,
      rewardAmount: 1,
      rewardToken: 'ETH',
      linkedPageId: pageId,
      maxSubmissions: 1,
      permissions: {
        submitter: [{
          group: 'space',
          id: spaceId
        }]
      }
    });
  }

  function cancelDraftBounty () {
    setDraftBounty(null);
  }

  async function deleteBounty (bountyId: string): Promise<true> {
    await charmClient.bounties.deleteBounty(bountyId);
    setBounties(_bounties => _bounties.filter(bounty => bounty.id !== bountyId));
    if (currentBounty?.id === bountyId) {
      setCurrentBounty(null);
    }
    return true;
  }

  async function refreshBounty (bountyId: string) {
    const refreshed = await charmClient.bounties.getBounty(bountyId);
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
    createDraftBounty,
    cancelDraftBounty,
    draftBounty,
    setBounties,
    currentBountyId,
    updateCurrentBountyId,
    currentBounty,
    setCurrentBounty: _setCurrentBounty,
    updateBounty,
    deleteBounty,
    refreshBounty,
    loadingBounties: isLoading
  }), [bounties, currentBountyId, currentBounty, draftBounty, isLoading]);

  return (
    <BountiesContext.Provider value={value}>
      {children}
    </BountiesContext.Provider>
  );
}

export const useBounties = () => useContext(BountiesContext);
