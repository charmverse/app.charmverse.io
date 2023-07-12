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
  if (props['injectCSS'] && typeof props['injectCSS'] !== 'boolean') {
    logDevError("'injectCSS' prop must be a boolean.")
  }
  if (props['allowChainSelector'] && typeof props['allowChainSelector'] !== 'boolean') {
    logDevError("'allowChainSelector' prop must be a boolean.")
  }
  if (props['allowMultipleConditions'] && typeof props['allowMultipleConditions'] !== 'boolean') {
    logDevError("'allowMultipleConditions' prop must be a boolean.")
  }
  if (props['permanentDefault'] && typeof props['permanentDefault'] !== 'boolean') {
    logDevError("'permanentDefault' prop must be a boolean.")
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

const getAllowedConditionTypes = (chainData, conditionsAllowed = null) => {
  if (!conditionsAllowed) {
    return chainData;
  } else {
    const chainDataHolder = chainData;
    const chainConditionsAllowed = {};
    conditionsAllowed.forEach(c => {
      if (!!chainData.types.conditionTypes[c]) {
        chainConditionsAllowed[c] = chainData.types.conditionTypes[c];
      } else {
        logDevError(`condition '${c}' not found or not supported for this chain.`)
      }
    })
    chainDataHolder.types.conditionTypes = chainConditionsAllowed;
    return chainDataHolder;
  }
}

const getAllowedConditions = (chainsAllowed, conditionsAllowed, defaultAllowedChainsObj) => {
  const currentlyAllowedChains = [];
  chainsAllowed.forEach(c => {
    if (!!defaultAllowedChainsObj[c]) {
      let chainData = defaultAllowedChainsObj[c];
      chainData = getAllowedConditionTypes(chainData, conditionsAllowed[c]);
      currentlyAllowedChains.push(chainData);
    } else {
      logDevError(`chain '${c}' not found. Check the spelling.`)
    }
  })
  return currentlyAllowedChains;
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
  getAllowedConditions,
  stripNestedArray,
  setDevModeIsAllowed
}
