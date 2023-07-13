import React from 'react';

const LitInput = ({
                    value,
                    setValue,
                    errorMessage = null,
                    placeholder = '',
                    type = 'text',
                    disabled = false,
                    loading = false,
                  }) => {
  return (
    <div className={`lsm-input-container`}>
      <input placeholder={placeholder}
             value={value}
             type={type}
             disabled={disabled}
             onChange={(e) => setValue(e.target.value)}
             className={'lsm-input'}/>
      {!loading ? (
        <p className={'lsm-input-error'}>
          {(errorMessage && value.length) ? errorMessage : ''}</p>
      ) : (
        <p className={'lsm-loading'}>
          Loading...</p>
      )}
    </div>
  );
};

export default LitInput;
