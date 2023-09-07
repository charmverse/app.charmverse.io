import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { ThreadsProvider } from 'hooks/useThreads';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ProposalPropertiesInput } from '../../ProposalProperties/ProposalProperties';

export type ProposalPageAndPropertiesInput = ProposalPropertiesInput & {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
};

type ProposalDialogContext = {
  newProposal?: Partial<ProposalPageAndPropertiesInput>;
  onClose?: () => void;
  pageId?: string;
};

type Context = {
  props: ProposalDialogContext;
  createProposal: (newProposal?: ProposalDialogContext['newProposal']) => void;
  hideProposal: () => void;
  showProposal: (context: ProposalDialogContext) => void;
};

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

  function createProposal(newProposal: ProposalDialogContext['newProposal'] = {}) {
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
