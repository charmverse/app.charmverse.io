import { createContext } from 'react';

export type Chain = { value: string };
export type AccessCondition = any; // TODO!;
export type HumanizedAccessCondition = any; // TODO!;
export type DisplayedPage = 'single' | 'multiple' | 'multiple-add' | 'review';
export type Flow = 'singleCondition' | 'multipleConditions';
export type Token = {
  address: string;
  name: string;
  value: string;
  standard: boolean;
  logoURI: string;
  symbol: string;
};

type ModalContextType = {
  handleUpdateUnifiedAccessControlConditions: (tokenList: AccessCondition[]) => void;
  handleDeleteAccessControlCondition: (localIndex: number, nestedIndex: number) => Promise<void>;
  clearAllAccessControlConditions: () => void;
  updateLogicOperator: (value: string, localIndex: number, nestedIndex?: number) => Promise<void>;
  sendUnifiedAccessControlConditions: () => Promise<void>;
  humanizedUnifiedAccessControlConditions: HumanizedAccessCondition[];
  unifiedAccessControlConditions: any[];
  chain: Chain | null;
  chainList: Chain[];
  setChain: (chain: Chain) => void;
  flow: Flow;
  setFlow: (flow: Flow) => void;
  setError: (error: any | null) => void;
  resetModal: () => void;
  tokenList: Token[];
  wipeInitialProps: () => void;
  displayedPage: DisplayedPage;
  setDisplayedPage: (page: DisplayedPage) => void;
};

export const ShareModalContext = createContext<ModalContextType>({} as ModalContextType);
