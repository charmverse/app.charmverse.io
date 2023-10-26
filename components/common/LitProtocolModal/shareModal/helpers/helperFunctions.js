let devModeIsAllowed = false;

const setDevModeIsAllowed = (allow) => {
  devModeIsAllowed = allow;
}

const logDevError = (message) => {
  if (devModeIsAllowed) {
    console.log(`Error in Lit Share Modal - ${message}`)
  }
}

const checkPropTypes = (props) => {
  // TODO: figure out best way to type all this nonsense
  if (props['chainsAllowed'] && !Array.isArray(props['chainsAllowed'])) {
    logDevError("'chainsAllowed' prop must be an array.")
  }
  if (props['defaultChain'] && typeof props['defaultChain'] !== 'string') {
    logDevError("'defaultChain' prop must be a string.")
  }
  if (props['allowChainSelector'] && typeof props['allowChainSelector'] !== 'boolean') {
    logDevError("'allowChainSelector' prop must be a boolean.")
  }
  if (props['isModal'] && typeof props['isModal'] !== 'boolean') {
    logDevError("'isModal' prop must be a boolean.")
  }
  if (props['allowDevMode'] && typeof props['allowDevMode'] !== 'boolean') {
    setDevModeIsAllowed(true);
    logDevError("'allowDevMode' prop must be a boolean.")
    setDevModeIsAllowed(false);
  }
  if (props['injectInitialState'] && typeof props['injectInitialState'] !== 'boolean') {
    logDevError("'injectInitialState' prop must be a boolean.")
  }
  if (props['initialFlow'] && (props['initialFlow'] !== 'singleCondition' || props['initialFlow'] !== 'multipleConditions')) {
    logDevError("'initialFlow' prop must be either `singleCondition` or `multipleConditions`.")
  }
  if (props['initialState'] && typeof props['initialState'] !== 'string') {
    logDevError("'initialState' prop must be a string.")
  }
}

const stripNestedArray = (unifiedAccessControlConditions) => {
  if (unifiedAccessControlConditions.length === 1 && Array.isArray(unifiedAccessControlConditions[0])) {
    return stripNestedArray(unifiedAccessControlConditions[0]);
  } else {
    return unifiedAccessControlConditions;
  }
}

export {
  logDevError,
  checkPropTypes,
  stripNestedArray,
  setDevModeIsAllowed
}
