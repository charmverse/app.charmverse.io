// import { uid } from 'node_modules/common.charmverse.io/packages/utilities-string/src';
// eslint-disable-next-line import/no-relative-packages, import/no-extraneous-dependencies
import { randomETHWalletAddress, matchWalletAddress } from 'charmverse-utilities';

export default function TestPage() {
  return (
    <div>
      <h1>
        Content {randomETHWalletAddress()} -- {String(matchWalletAddress(randomETHWalletAddress(), '0xb'))}
      </h1>
    </div>
  );
}
