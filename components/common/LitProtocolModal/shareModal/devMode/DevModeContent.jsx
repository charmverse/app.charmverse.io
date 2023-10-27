import React, { useEffect, useState } from 'react';

const DevModeContent = ({unifiedAccessControlConditions}) => {
  const [accTextArea, setAccTextArea] = useState('');

  useEffect(() => {
    if (unifiedAccessControlConditions) {
      const prettify = JSON.stringify(unifiedAccessControlConditions, undefined, 4);
      setAccTextArea(prettify);
    }
  }, [unifiedAccessControlConditions])

  return (
    <div className={'lsm-dev-mode-container'}>
      <label className={'lsm-dev-mode-container-label'}>Raw Access Control Conditions</label>
      <textarea className={'lsm-dev-mode-textarea'} rows={35} value={accTextArea} onChange={(e) => setAccTextArea(e.target.value)} />
    </div>
  )
}

export default DevModeContent;
