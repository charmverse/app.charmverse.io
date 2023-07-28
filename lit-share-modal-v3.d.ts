import type { JsonStoreSigningRequest } from '@lit-protocol/types';
import type * as React from 'react';

declare module 'lit-share-modal-v3' {
  export type ConditionsModalResult = Pick<JsonStoreSigningRequest, 'unifiedAccessControlConditions' | 'permanant'>;

  interface Token {
    label: string;
    logo: string;
    value: string;
    symbol: string;
    standard: 'ERC20' | 'ERC721' | 'ERC1155';
  }

  export interface ShareModalProps {
    isModal?: boolean;
    onClose?: () => void;
    showModal?: boolean;
    darkMode?: boolean;
    cssSubstitution?: any;
    defaultTokens?: Token[];
    injectCSS?: boolean;
    permanentDefault?: boolean;
    onUnifiedAccessControlConditionsSelected(result: ConditionsModalResult): void;
    chainsAllowed?: string[];
  }

  declare const ShareModal: React.FC<ShareModalProps>;

  export default ShareModal;
}
