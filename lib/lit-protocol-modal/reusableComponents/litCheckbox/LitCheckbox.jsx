import React from "react";

const LitCheckbox = ({value, setValue, label}) => {
  return (
    <div
      className={'lsm-checkbox-container'}>
      <input className={'lsm-checkbox-input'} type="checkbox" id="edit" name="edit"
             checked={value} value={value} onChange={(e) => setValue(e.target.checked)}/>
      <label className={'lsm-checkbox-label'} htmlFor="edit">{label}</label>
    </div>
  )
}

export default LitCheckbox;
