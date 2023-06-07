import type { ProposalCategory } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface ProposalDialogContext {
  newProposal?: { category: ProposalCategory | null };
  onClose?: () => void;
  pageId?: string;
}

interface Context {
  props: ProposalDialogContext;
  createProposal: (newProposal: ProposalDialogContext['newProposal']) => void;
  hideProposal: () => void;
  showProposal: (context: ProposalDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  createProposal: () => {},
  hideProposal: () => {},
  showProposal: () => {}
});

export const useProposalDialog = () => useContext(ContextElement);

export function ProposalDialogProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<ProposalDialogContext>({});

  function hideProposal() {
    props?.onClose?.();
    setProps({});
  }

  function createProposal(newProposal: ProposalDialogContext['newProposal']) {
    setProps({ newProposal });
  }

  function showProposal(_context: ProposalDialogContext) {
    setProps(_context);
  }

  const value = useMemo(
    () => ({
      props,
      showProposal,
      createProposal,
      hideProposal
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
