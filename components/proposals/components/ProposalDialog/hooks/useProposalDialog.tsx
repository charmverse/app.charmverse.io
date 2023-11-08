import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type ProposalDialogContext = {
  pageId?: string;
};

type Context = {
  props: ProposalDialogContext;
  hideProposal: () => void;
  showProposal: (context: ProposalDialogContext) => void;
};

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  hideProposal: () => {},
  showProposal: () => {}
});

export const useProposalDialog = () => useContext(ContextElement);

export function ProposalDialogProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<ProposalDialogContext>({});

  function hideProposal() {
    setProps({});
  }

  function showProposal(_context: ProposalDialogContext) {
    setProps(_context);
  }

  const value = useMemo(
    () => ({
      props,
      showProposal,
      hideProposal
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
