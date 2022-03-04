import * as React from 'react';

declare module 'lit-access-control-conditions-modal' {

  interface SharedItem {
    name: string;
  }

  export interface ShareModalProps {
    onClose: () => void;
    sharingItems: SharedItem[];
    onAccessControlConditionsSelected () : void;
    getSharingLink (): string;
    showStep?: 'whatToDo' | 'ableToAccess' | 'whichWallet' | 'assetWallet' | 'DAOMembers' | 'accessCreated' | 'selectTokens' | 'recentRequirements' | 'currentRequirements' | 'choosePOAP';
  }

  // eslint-disable-next-line react/prefer-stateless-function
  export class ShareModal extends React.Component<ShareModalProps, any> {}

}
