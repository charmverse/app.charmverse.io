
const DevModeHeader = ({showDevMode, setShowDevMode}) => {
  return (
    <header className={'lsm-header-container'}>
      <h3 className={'lsm-header-text'}>Dev Mode</h3>
      <button className={'lsm-dev-mode-show-button'} onClick={() => setShowDevMode(!showDevMode)}>{showDevMode ? 'Hide Dev' : 'Show Dev'}</button>
    </header>
  );
}

export default DevModeHeader;
