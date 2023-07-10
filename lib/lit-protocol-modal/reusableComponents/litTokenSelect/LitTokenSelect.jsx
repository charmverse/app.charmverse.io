import React, { useMemo, useContext } from 'react';


import {
  WindowedMenuList,
  createFilter,
  components,
} from "react-windowed-select";

import { ShareModalContext } from "../../shareModal/createShareContext.js";
import CreatableSelect from "react-select/creatable";

const LitTokenSelect = ({label, setSelectedToken, option, selectedToken, allowEthereum = false}) => {
  const {tokenList, defaultTokens} = useContext(ShareModalContext);

  const Option = ({children, data: {label, logo, symbol}, ...props}) => {
    const {onMouseMove, onMouseOver, ...rest} = props.innerProps;
    const newProps = Object.assign(props, {innerProps: rest});

    return (
      <components.Option {...newProps} className={'lsm-option-select'}>
        {!!logo && (
          <img
            src={logo}
            style={{height: '1em', marginRight: '0.5em'}}
            className={'lsm-chain-selector-options-icons'}
            alt={label}
          />
        )}
        <div>
          <div className={''}>{label}</div>
          <div className={'lsm-condition-prompt-text-no-margin'}>{symbol}</div>
        </div>
      </components.Option>
    );
  };

  const tokenSelectRows = useMemo(() => {
    let formattedDefaultTokens = [];

    if (defaultTokens) {
      formattedDefaultTokens = defaultTokens.map((t) => {
        return {
          label: t.label,
          value: t.value,
          standard: t.standard,
          logo: t.logo,
          symbol: t.symbol,
        }
      })
    }

    if (allowEthereum) {
      return [
        {
          label: "Ethereum",
          value: "ethereum",
          symbol: "ETH",
          logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg",
        },
        ...formattedDefaultTokens,
        ...tokenList.map((t) => ({
          label: t.name,
          value: t.address,
          standard: t.standard,
          logo: t.logoURI,
          symbol: t.symbol,
        })),
      ];
    } else {
      return [
        ...formattedDefaultTokens,
        ...tokenList.map((t) => ({
          label: t.name,
          value: t.address,
          standard: t.standard,
          logo: t.logoURI,
          symbol: t.symbol,
        })),
      ];
    }

  }, [ tokenList ]);

  return (
    <CreatableSelect
      className={'lsm-token-select'}
      classNamePrefix={'lsm-ts'}
      filterOption={createFilter({ignoreAccents: false})}
      components={{Option, MenuList: WindowedMenuList}}
      isClearable
      isSearchable
      defaultValue={""}
      options={tokenSelectRows}
      styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
      menuPortalTarget={document.body}
      onChange={setSelectedToken}
    />
  );
};

export default LitTokenSelect;
