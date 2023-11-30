import styled from '@emotion/styled';
import type { JsonStoreSigningRequest } from '@lit-protocol/types';
import { useEffect, useState } from 'react';

import { isProdEnv } from 'config/constants';

import type { LitChainConfig } from '../chainConfig';
import { chainConfig } from '../chainConfig';
import LitHeader from '../reusableComponents/litHeader/LitHeader';

import type {
  AccessCondition,
  Chain,
  DisplayedPage,
  Flow,
  HumanizedAccessCondition,
  Token
} from './createShareContext';
import { ShareModalContext } from './createShareContext';
import DevModeContent from './devMode/DevModeContent';
import DevModeHeader from './devMode/DevModeHeader';
import { checkPropTypes, logDevError, setDevModeIsAllowed, stripNestedArray } from './helpers/helperFunctions.js';
import {
  cleanUnifiedAccessControlConditions,
  getAllChains,
  getAllNeededAuthSigs,
  humanizeNestedConditions
} from './helpers/multipleConditionHelpers';
import MultipleConditionSelect from './multipleConditionSelect/MultipleConditionSelect';
import ReviewConditions from './reviewConditions/ReviewConditions';
import SingleConditionSelect from './singleConditionSelect/SingleConditionSelect';

export type ConditionsModalResult = Pick<JsonStoreSigningRequest, 'unifiedAccessControlConditions'> & {
  authSigTypes: string[];
  chains: string[];
  permanent: true; // maybe not needed anymore
};

const allowDevMode = !isProdEnv;

// Example: https://github.com/LIT-Protocol/lit-js-sdk/blob/9b956c0f399493ae2d98b20503c5a0825e0b923c/build/manual_tests.html
// Docs: https://www.npmjs.com/package/lit-share-modal-v3
const ShareModalContainer = styled.div`
  width: 100%;
  min-height: 500px;

  .lsm-single-condition-select-container,
  .lsm-condition-display,
  .lsm-condition-container,
  .lsm-review-conditions-group-container {
    overflow-y: auto !important;
  }
  /* Remove position: absolute so we have a dynamic height */
  .lsm-condition-display,
  .lsm-review-conditions-container,
  .lsm-single-condition-multiple-button,
  .lsm-lit-footer,
  // container when selecting multiple conditions
  .lsm-multiple-conditions-container {
    position: relative;
    top: 0;
  }
`;

type Props = {
  onUnifiedAccessControlConditionsSelected(result: ConditionsModalResult): void;
};

const defaultChain = 'ethereum';
const chainMap = chainConfig.reduce<Record<string, LitChainConfig>>((acc, _chain) => {
  acc[_chain.value] = _chain;
  return acc;
}, {});

function ShareModal(props: Props) {
  const [displayedPage, setDisplayedPage] = useState<DisplayedPage>('single');
  const [error, setError] = useState<Error | any | null>(null);
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] = useState<any[]>([]);
  const [humanizedUnifiedAccessControlConditions, setHumanizedUnifiedAccessControlConditions] = useState<
    HumanizedAccessCondition[]
  >([]);
  const [flow, setFlow] = useState<Flow>('singleCondition');
  const [tokenList, setTokenList] = useState<Token[] | null>(null);
  const [chain, setChain] = useState<Chain>(chainMap[defaultChain]);
  const [showDevMode, setShowDevMode] = useState(false);
  const { onUnifiedAccessControlConditionsSelected } = props;

  useEffect(() => {
    checkPropTypes(props);
    setDevModeIsAllowed(allowDevMode);
    getTokens();
  }, []);

  async function getTokens() {
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
      const tokens = [...erc20s.tokens, ...erc721s.tokens]
        .filter((a) => a.name.trim())
        .sort((a, b) => (a.name.toLowerCase().trim() > b.name.toLowerCase().trim() ? 1 : -1));
      setTokenList(tokens);
    } catch (err) {
      setTokenList([]);
      setError(err);
    }
  }

  const handleDeleteAccessControlCondition = async (localIndex: number, nestedIndex: number) => {
    const updatedAcc = unifiedAccessControlConditions;
    // TODO: create nested delete

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

  const checkForAddingOperatorToCondition = (acc: any[], newAccessControlCondition: AccessCondition) => {
    const updatedAcc = acc;
    if (!acc.length && newAccessControlCondition[0]) {
      updatedAcc.push(newAccessControlCondition[0]);
    } else {
      updatedAcc.push({ operator: 'and' });
      updatedAcc.push(newAccessControlCondition[0]);
    }
    return updatedAcc;
  };

  async function updateState(acc: any[]) {
    const cleanedAcc = cleanUnifiedAccessControlConditions(acc);
    let humanizedData;
    try {
      humanizedData = await humanizeNestedConditions([...cleanedAcc]);
      setHumanizedUnifiedAccessControlConditions([...humanizedData]);
    } catch (err) {
      logDevError(err);
    }
    setUnifiedAccessControlConditions([...cleanedAcc]);
  }

  const handleUpdateUnifiedAccessControlConditions = async (
    newAccessControlCondition: AccessCondition[],
    isNested = false,
    index = -1
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

  const updateLogicOperator = async (value: string, localIndex: number, nestedIndex = -1) => {
    const updatedAcc = [...unifiedAccessControlConditions];
    if (nestedIndex) {
      updatedAcc[localIndex][nestedIndex].operator = value;
    } else {
      updatedAcc[localIndex].operator = value;
    }

    await updateState(updatedAcc);
  };

  // TODO: functions for keeping

  const clearAllAccessControlConditions = () => {
    setUnifiedAccessControlConditions([]);
    setHumanizedUnifiedAccessControlConditions([]);
  };

  const resetModal = () => {
    setFlow('singleCondition');
    setDisplayedPage('single');
    clearAllAccessControlConditions();
    setError(null);
  };

  const sendUnifiedAccessControlConditions = async () => {
    const cleanedAccessControlConditions = stripNestedArray(unifiedAccessControlConditions);

    const allConditionTypes = getAllNeededAuthSigs(
      unifiedAccessControlConditions
    ) as ConditionsModalResult['authSigTypes'];
    const authSigTypes = [...new Set(allConditionTypes)];

    const allChainTypes = getAllChains(unifiedAccessControlConditions) as string[];
    const chains = [...new Set(allChainTypes)];

    const keyParams: ConditionsModalResult = {
      unifiedAccessControlConditions: cleanedAccessControlConditions,
      permanent: true,
      chains,
      authSigTypes
    };
    // TODO: comment back in to export conditions
    await onUnifiedAccessControlConditionsSelected(keyParams);
    resetModal();
  };

  return (
    <ShareModalContainer>
      <div className='lsm-share-modal-container'>
        {!error && (
          <ShareModalContext.Provider
            // eslint-disable-next-line react/jsx-no-constructed-context-values
            value={{
              handleUpdateUnifiedAccessControlConditions,
              handleDeleteAccessControlCondition,
              clearAllAccessControlConditions,
              updateLogicOperator,
              sendUnifiedAccessControlConditions,
              resetModal,
              wipeInitialProps: () => {},
              chain,
              chainList: chainConfig,
              setChain,
              setError,
              setDisplayedPage,
              setFlow,
              humanizedUnifiedAccessControlConditions,
              unifiedAccessControlConditions,
              displayedPage,
              tokenList: tokenList || [],
              flow
            }}
          >
            {allowDevMode ? <DevModeHeader showDevMode={showDevMode} setShowDevMode={setShowDevMode} /> : <LitHeader />}
            {allowDevMode && showDevMode ? (
              <DevModeContent unifiedAccessControlConditions={unifiedAccessControlConditions} />
            ) : (
              <div className='lsm-condition-display'>
                {flow === 'singleCondition' && displayedPage !== 'review' && (
                  <SingleConditionSelect chain={chain} initialState={null} initialCondition={null} />
                )}
                {flow === 'multipleConditions' && displayedPage !== 'review' && (
                  <MultipleConditionSelect
                    chain={chain}
                    initialState={null}
                    initialCondition={null}
                    humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions}
                  />
                )}
                {displayedPage === 'review' && (
                  <ReviewConditions humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions} />
                )}
              </div>
            )}
          </ShareModalContext.Provider>
        )}
        {error && (
          <span className='lsm-error-display'>
            <p className='lsm-font-segoe lsm-text-brand-5'>An error occurred with an external API:</p>
            <p className='lsm-font-segoe'>{error.toString()}</p>
            <p className='lsm-font-segoe lsm-text-brand-5'>Please close and reopen the modal to reconnect.</p>
          </span>
        )}
      </div>
    </ShareModalContainer>
  );
}

export default ShareModal;
