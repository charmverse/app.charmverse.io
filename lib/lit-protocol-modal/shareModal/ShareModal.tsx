// @ts-nocheck

import type { SigningConditions } from '@lit-protocol/types';
import { useEffect, useState } from 'react';

import { chainConfig } from '../chainConfig';

import { ShareModalContext } from './createShareContext';
import DevModeContent from './devMode/DevModeContent';
import DevModeHeader from './devMode/DevModeHeader';
import {
  checkPropTypes,
  getAllowedConditions,
  logDevError,
  setDevModeIsAllowed,
  stripNestedArray
} from './helpers/helperFunctions.js';
import {
  cleanUnifiedAccessControlConditions,
  getAllChains,
  getAllNeededAuthSigs,
  humanizeNestedConditions
} from './helpers/multipleConditionHelpers';
import { TOP_LIST } from './helpers/topList';
import MultipleConditionSelect from './multipleConditionSelect/MultipleConditionSelect';
import ReviewConditions from './reviewConditions/ReviewConditions';
import SingleConditionSelect from './singleConditionSelect/SingleConditionSelect';
import LitHeader from '../reusableComponents/litHeader/LitHeader';
export type ConditionsModalResult = Pick<SigningConditions, 'unifiedAccessControlConditions' | 'permanant'>;
import LitLoading from '../reusableComponents/litLoading/LitLoading';
import LitConfirmationModal from '../reusableComponents/litConfirmationModal/LitConfirmationModal';

interface Token {
  label: string;
  logo: string;
  value: string;
  symbol: string;
  standard: 'ERC20' | 'ERC721' | 'ERC1155';
}

const chainsAllowed = chainConfig.map((chain) => chain.value) as string[];

function ShareModal(props: {
  isModal?: boolean;
  onClose?: () => void;
  darkMode?: boolean;
  cssSubstitution?: any;
  defaultTokens?: Token[];
  injectCSS?: boolean;
  permanentDefault?: boolean;
  onUnifiedAccessControlConditionsSelected(result: ConditionsModalResult): void;
}) {
  const [displayedPage, setDisplayedPage] = useState('single');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] = useState([]);
  const [humanizedUnifiedAccessControlConditions, setHumanizedUnifiedAccessControlConditions] = useState([]);
  const [flow, setFlow] = useState('singleCondition');
  const [tokenList, setTokenList] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [chain, setChain] = useState(null);
  const [chainList, setChainList] = useState([]);
  const [showDevMode, setShowDevMode] = useState(false);

  const [storedInitialState, setStoredInitialState] = useState(null);
  const [storedInitialCondition, setStoredInitialCondition] = useState('chooseAccess');

  const {
    onClose = () => false,
    onUnifiedAccessControlConditionsSelected = (conditions) => console.log('conditions', conditions),
    injectInitialState = false,
    initialUnifiedAccessControlConditions = null,
    initialFlow = null,
    initialCondition = null,
    initialState = null,
    defaultTokens = TOP_LIST,
    defaultChain = 'ethereum',
    allowChainSelector = true,
    allowMultipleConditions = true,
    permanentDefault = false,
    conditionsAllowed = {},
    isModal = true,
    darkMode = false,
    allowDevMode = false
  } = props;

  useEffect(() => {
    const chainMap = chainConfig.reduce((acc, chain) => {
      acc[chain.value] = chain;
      return acc;
    }, {});
    checkPropTypes(props);
    setDevModeIsAllowed(allowDevMode);
    // check and set allowed conditions per chain
    const chainsWithAllowedConditions = getAllowedConditions(chainsAllowed, conditionsAllowed, chainMap);
    setChainList(chainsWithAllowedConditions);

    setInitialChain(chainsWithAllowedConditions);

    getTokens();

    if (injectInitialState) {
      if (Array.isArray(initialUnifiedAccessControlConditions)) {
        updateState(initialUnifiedAccessControlConditions);
        setFlow('multipleConditions');
        setDisplayedPage('multiple');
      }
      if (initialFlow) {
        setFlow(initialFlow);
        if (initialFlow === 'multipleConditions') {
          setDisplayedPage('multiple');
        }
      }
      if (initialCondition) {
        setStoredInitialCondition(initialCondition);
        if (initialFlow === 'multipleConditions') {
          setDisplayedPage('multiple-add');
        }
      }
      if (initialState) {
        setStoredInitialState(initialState);
      }
    }
  }, []);

  const wipeInitialProps = () => {
    // setStoredInitialCondition(null);
    // setStoredInitialState(null);
  };

  const setInitialChain = async (chainsAllowed) => {
    // get default chain
    const initialChain = chainsAllowed.find((c) => c.value === defaultChain);
    if (!initialChain) {
      logDevError('no default chain found.  Check defaultChain prop.');
      return;
    }
    await setChain(initialChain);
  };

  document.addEventListener('lit-ready', function (e) {}, false);

  // TODO: maybe keep functions below

  const getTokens = async () => {
    // get token list and cache it
    try {
      // Taken from https://github.com/LIT-Protocol/lit-js-sdk/blob/abf4189dcae3d5d6611ee0698ff69b18c5876d6c/src/utils/lit.js#L1458
      // erc20
      const erc20Url = 'https://tokens.coingecko.com/uniswap/all.json';
      const erc20Promise = fetch(erc20Url).then((r) => r.json());

      // erc721
      const erc721Url = 'https://raw.githubusercontent.com/0xsequence/token-directory/main/index/mainnet/erc721.json';
      const erc721Promise = fetch(erc721Url).then((r) => r.json());

      const [erc20s, erc721s] = await Promise.all([erc20Promise, erc721Promise]);
      const tokens = [...erc20s.tokens, ...erc721s.tokens].sort((a, b) => (a.name > b.name ? 1 : -1));
      setTokenList(tokens);
    } catch (err) {
      setTokenList([]);
      setError(err);
      console.log('Error retrieving token list:', err);
    }
    setLoading(false);
  };

  const handleDeleteAccessControlCondition = async (localIndex, nestedIndex) => {
    const updatedAcc = unifiedAccessControlConditions;
    // TODO: create nested delete
    console.log('localIndex', localIndex);
    console.log('nestedIndex', nestedIndex);

    if (nestedIndex === null) {
      if (localIndex > 1 && localIndex === updatedAcc.length - 1) {
        updatedAcc.splice(-2);
      } else {
        updatedAcc.splice(updatedAcc[localIndex], 2);
      }
    } else if (nestedIndex !== 0 && nestedIndex === updatedAcc[localIndex].length - 1) {
      updatedAcc[localIndex].splice(-2);
    } else {
      updatedAcc[localIndex].splice(updatedAcc[localIndex][nestedIndex], 2);
    }

    await updateState(updatedAcc);

    if (updatedAcc.length === 0 && flow === 'singleCondition') {
      setDisplayedPage('single');
    }
  };

  const checkForAddingOperatorToCondition = (acc, newAccessControlCondition) => {
    const updatedAcc = acc;
    if (!acc.length && newAccessControlCondition[0]) {
      updatedAcc.push(newAccessControlCondition[0]);
    } else {
      updatedAcc.push({ operator: 'and' });
      updatedAcc.push(newAccessControlCondition[0]);
    }
    return updatedAcc;
  };

  const handleUpdateUnifiedAccessControlConditions = async (
    newAccessControlCondition,
    isNested = false,
    index = null
  ) => {
    let updatedAcc = [...unifiedAccessControlConditions];
    if (!newAccessControlCondition[0]) {
      return;
    }

    if (isNested) {
      if (Array.isArray(updatedAcc[index])) {
        updatedAcc[index] = checkForAddingOperatorToCondition(updatedAcc[index], newAccessControlCondition);
      } else {
        const nestedUpdatedAcc = checkForAddingOperatorToCondition([updatedAcc[index]], newAccessControlCondition);
        updatedAcc[index] = nestedUpdatedAcc;
      }
    } else {
      updatedAcc = checkForAddingOperatorToCondition(updatedAcc, newAccessControlCondition);
    }

    await updateState(updatedAcc);
  };

  const updateLogicOperator = async (value, localIndex, nestedIndex = null) => {
    const updatedAcc = [...unifiedAccessControlConditions];
    if (nestedIndex) {
      updatedAcc[localIndex][nestedIndex].operator = value;
    } else {
      updatedAcc[localIndex].operator = value;
    }

    await updateState(updatedAcc);
  };

  const updateState = async (acc) => {
    const cleanedAcc = cleanUnifiedAccessControlConditions(acc);
    let humanizedData;
    try {
      humanizedData = await humanizeNestedConditions([...cleanedAcc]);
      setHumanizedUnifiedAccessControlConditions([...humanizedData]);
    } catch (err) {
      console.log(err);
      logDevError(err);
    }
    setUnifiedAccessControlConditions([...cleanedAcc]);
  };

  // TODO: functions for keeping

  const clearAllAccessControlConditions = () => {
    setUnifiedAccessControlConditions([]);
    setHumanizedUnifiedAccessControlConditions([]);
  };

  const handleClose = () => {
    if (unifiedAccessControlConditions.length) {
      setShowConfirmationModal(true);
    } else {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setFlow('singleCondition');
    setDisplayedPage('single');
    clearAllAccessControlConditions();
    setError(null);
    setInitialChain(chainList).then(() => {});
  };

  const handleConfirmModalClose = (modalResponse) => {
    if (modalResponse === 'yes') {
      resetModal();
      setShowConfirmationModal(false);
      onClose();
    } else {
      setShowConfirmationModal(false);
    }
  };

  const sendUnifiedAccessControlConditions = async (conditionsArePermanent) => {
    const cleanedAccessControlConditions = stripNestedArray(unifiedAccessControlConditions);

    const allConditionTypes = getAllNeededAuthSigs(unifiedAccessControlConditions);
    const authSigTypes = [...new Set(allConditionTypes)];

    const allChainTypes = getAllChains(unifiedAccessControlConditions);
    const chains = [...new Set(allChainTypes)];

    const keyParams = {
      unifiedAccessControlConditions: cleanedAccessControlConditions,
      permanent: conditionsArePermanent,
      chains,
      authSigTypes
    };
    // TODO: comment back in to export conditions
    await onUnifiedAccessControlConditionsSelected(keyParams);
    resetModal();
  };

  const getTheme = () => {
    if (darkMode) {
      return 'lsm-dark-theme';
    } else {
      return 'lsm-light-theme';
    }
  };

  if (loading) {
    return (
      <span className='lsm-loading-display'>
        <LitLoading />
      </span>
    );
  }

  return (
    <div className={`lsm-share-modal-container ${getTheme()}`}>
      {!error && (
        <ShareModalContext.Provider
          value={{
            handleUpdateUnifiedAccessControlConditions,
            handleDeleteAccessControlCondition,
            clearAllAccessControlConditions,
            updateLogicOperator,
            handleClose,
            sendUnifiedAccessControlConditions,
            resetModal,
            wipeInitialProps,
            allowChainSelector,
            chain,
            chainList,
            setChain,
            setError,
            setDisplayedPage,
            setFlow,
            humanizedUnifiedAccessControlConditions,
            unifiedAccessControlConditions,
            displayedPage,
            tokenList,
            flow,
            defaultTokens,
            allowMultipleConditions,
            permanentDefault
          }}
        >
          {allowDevMode ? (
            <DevModeHeader
              handleClose={handleClose}
              isModal={isModal}
              showDevMode={showDevMode}
              setShowDevMode={setShowDevMode}
            />
          ) : (
            <LitHeader handleClose={handleClose} isModal={isModal} />
          )}
          {allowDevMode && showDevMode ? (
            <DevModeContent unifiedAccessControlConditions={unifiedAccessControlConditions} />
          ) : (
            <div className='lsm-condition-display'>
              {flow === 'singleCondition' && displayedPage !== 'review' && (
                <SingleConditionSelect
                  stepAfterUpdate='review'
                  chain={chain}
                  initialState={storedInitialState}
                  initialCondition={storedInitialCondition}
                  humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions}
                  unifiedAccessControlConditions={unifiedAccessControlConditions}
                />
              )}
              {flow === 'multipleConditions' && displayedPage !== 'review' && (
                <MultipleConditionSelect
                  chain={chain}
                  initialState={storedInitialState}
                  initialCondition={initialCondition}
                  humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions}
                  unifiedAccessControlConditions={unifiedAccessControlConditions}
                />
              )}
              {displayedPage === 'review' && (
                <ReviewConditions
                  chain={chain}
                  humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions}
                  unifiedAccessControlConditions={unifiedAccessControlConditions}
                />
              )}
            </div>
          )}
          <LitConfirmationModal
            message='Are you sure you want to close the modal?'
            showConfirmationModal={showConfirmationModal}
            onClick={handleConfirmModalClose}
          />
        </ShareModalContext.Provider>
      )}
      {error && (
        <span className='lsm-error-display'>
          <p className='lsm-font-segoe lsm-text-brand-5'>An error occurred with an external API:</p>
          <p className='lsm-font-segoe'>{error.toString()}</p>
          <p className='lsm-font-segoe lsm-text-brand-5'>Please close and reopen the modal to reconnect.</p>
          <button className='lsm-error-button lsm-bg-brand-4' onClick={onClose}>
            Close
          </button>
        </span>
      )}
    </div>
  );
}

export default ShareModal;
