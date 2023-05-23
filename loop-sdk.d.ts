declare module '@loop-crypto/loop-sdk' {
  export interface LoopProps {
    verifyWebhook(body: string, signature: string): boolean;
    getTransfers(opts: { transferId: string; wallet: string; networkId: number; entityId: string }): Promise<any>;
    sendTransfers(transfers: {
      invoiceId: string;
      entityId: string;
      networkId: number;
      itemId: string;
      from: string;
      to: string;
      token: string;
      amount: string;
      usd: boolean;
      signature: string;
      billDate: number;
    }): Promise<object[]>;
    cancelTransfers(transferIds: string[]): Promise<object[]>;
    signTransfer(opts: {
      invoiceId: string;
      fromAddress: string;
      toAddress: string;
      tokenAddress: string;
      amount: number;
      usd: boolean;
    }): string;
    signSendTransfer(opts: {
      invoiceId: string;
      itemId: string;
      fromAddress: string;
      toAddress: string;
      tokenAddress: string;
      amount: number;
      usd: boolean;
      billDate: number;
      entityId: string;
    }): Promise<object[]>;
    utils: {
      loopFetch(): any;
    };
  }

  export declare const loop: LoopProps;
}
