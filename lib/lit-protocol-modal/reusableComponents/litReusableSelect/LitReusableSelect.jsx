import React from 'react';
import Select, { components } from "react-select";

const LitReusableSelect = ({options, label, setOption, option, searchable = true}) => {

  const { Option } = components;
  const IconOption = (props) => {
    return (
      <Option {...props}>
        {props.data.label}
      </Option>
    );
  }

  return (
    <div className={'lsm-w-full'}>
      {!!options && option && (
        <span className={'lsm-reusable-select-container'}>
          <Select
            className={'lsm-reusable-select'}
            classNamePrefix={'lsm'}
            value={option.name}
            options={options}
            isSeachable={searchable}
            onChange={(c) => setOption(c)}
            components={{ Option: IconOption }}
          />
        </span>
      )}
    </div>
  )
}

export default LitReusableSelect;
