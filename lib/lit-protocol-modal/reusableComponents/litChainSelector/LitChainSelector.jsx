import React, { useContext } from 'react';
import Select, { components } from 'react-select';

import { ShareModalContext } from '../../shareModal/createShareContext';

function LitChainSelector() {
  const { chain, setChain, chainList, allowChainSelector } = useContext(ShareModalContext);

  const { Option } = components;
  function IconOption(props) {
    return (
      <Option {...props}>
        <img
          src={props.data.logo}
          style={{ height: '1em', marginRight: '0.5em' }}
          className='lsm-chain-selector-options-icons'
          alt={props.data.label}
        />
        {props.data.label}
      </Option>
    );
  }

  return (
    <div>
      {!!chain && !!chainList && (
        <span className='lsm-chain-selector-container'>
          <img src={chain.logo} className='lsm-chain-selector-control-icon' />
          {allowChainSelector ? (
            <Select
              className='lsm-chain-selector'
              classNamePrefix='lsm'
              defaultValue={chainList.find((c) => c.value === chain.value)}
              options={chainList}
              onChange={(c) => setChain(c)}
              components={{ Option: IconOption }}
            />
          ) : (
            <span className='lsm-disabled-selector'>{chain.label}</span>
          )}
        </span>
      )}
    </div>
  );
}

export default LitChainSelector;
