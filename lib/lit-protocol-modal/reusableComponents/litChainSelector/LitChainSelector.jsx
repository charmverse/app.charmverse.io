import { useContext } from 'react';
import { ShareModalContext } from '../../shareModal/createShareContext';

import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
function LitChainSelector() {
  const { chain, setChain, chainList } = useContext(ShareModalContext);

  return (
    <div>
      {!!chain && !!chainList && (
        <span className='lsm-chain-selector-container'>
          <img src={chain.logo} className='lsm-chain-selector-control-icon' />
          <InputSearchBlockchain
            defaultChainId={chain.chainId}
            hideInputIcon
            fullWidth
            chains={chainList.map(chain => chain.chainId)}
            onChange={(chainId) => setChain(chainList.find(chain => chain.chainId === chainId))}
          />
        </span>
      )}
    </div>
  );
}

export default LitChainSelector;
