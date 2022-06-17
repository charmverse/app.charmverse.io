import * as React from 'react';

declare module 'lit-share-modal' {

  export type ConditionsModalResult = Pick<SigningConditions, 'accessControlConditions' | 'permanant'>;

  interface Token {
    label: string;
    logo: string;
    value: string;
    symbol: string;
    standard: 'ERC20' | 'ERC721';
  }

  export interface ShareModalProps {
    onClose: () => void;
    showModal?: boolean;
    darkMode?: boolean;
    defaultTokens?: Token[];
    onAccessControlConditionsSelected (result: ConditionsModalResult): void;
  }

  // eslint-disable-next-line react/prefer-stateless-function
  class ShareModal extends React.Component<ShareModalProps, any> {}

  export default ShareModal;

}
