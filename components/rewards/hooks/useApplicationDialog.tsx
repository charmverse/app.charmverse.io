import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Context = {
  currentApplicationId: string | null;
  currentRewardId: string | null;
  isOpen: boolean;
  hideApplication: () => void;
  showApplication: (applicationId: string) => void;
  createApplication: (rewardId: string) => void;
  openedFromModal: boolean;
};

const ContextElement = createContext<Readonly<Context>>({
  currentApplicationId: null,
  currentRewardId: null,
  isOpen: false,
  hideApplication: () => {},
  showApplication: () => {},
  createApplication: () => {},
  openedFromModal: false
});

export const useApplicationDialog = () => useContext(ContextElement);

export function ApplicationDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [currentRewardId, setCurrentRewardId] = useState<string | null>(null);
  const [openedFromModal, setOpenedFromModal] = useState(false);
  const router = useRouter();

  function hideApplication() {
    setCurrentApplicationId(null);
    setIsOpen(false);
    setOpenedFromModal(false);
  }

  function showApplication(_applicationId: string, fromModal = false) {
    setCurrentApplicationId(_applicationId);
    setIsOpen(true);
    setOpenedFromModal(fromModal);

    // opened from modal
    if (router.pathname !== '/[domain]/[pageId]') {
      setOpenedFromModal(true);
    }
  }

  function createApplication(_rewardId: string) {
    setCurrentRewardId(_rewardId);
    setCurrentApplicationId(null);
    setIsOpen(true);

    // opened from modal
    if (router.pathname !== '/[domain]/[pageId]') {
      setOpenedFromModal(true);
    }
  }

  const value = useMemo(
    () => ({
      currentApplicationId,
      isOpen,
      showApplication,
      hideApplication,
      createApplication,
      openedFromModal,
      currentRewardId
    }),
    [isOpen, currentApplicationId, openedFromModal, currentRewardId]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
