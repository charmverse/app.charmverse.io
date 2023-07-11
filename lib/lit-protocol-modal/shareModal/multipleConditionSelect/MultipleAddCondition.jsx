import React, { useContext, useState } from 'react';
import { ShareModalContext } from "../createShareContext.js";
import LitChainSelector from "../../reusableComponents/litChainSelector/LitChainSelector";
import LitChooseAccessButton from "../../reusableComponents/litChooseAccessButton/LitChooseAccessButton";
import LitFooter from "../../reusableComponents/litFooter/LitFooter";

const MultipleAddCondition = ({
                                selectPage,
                                setSelectPage,
                                chain,
                                isNested = false,
                                endOfCreateCondition,
                                initialState = null
                              }) => {
  const {
    setDisplayedPage,
  } = useContext(ShareModalContext);

  const [ unifiedAccessControlConditions, setUnifiedAccessControlConditions ] = useState([]);
  const [ submitDisabled, setSubmitDisabled ] = useState(true);

  const backButtonAction = () => {
    setSelectPage('chooseAccess');
    setUnifiedAccessControlConditions([]);
  }

  const toggleCoordinateUpdateAccessControl = () => {
    endOfCreateCondition(unifiedAccessControlConditions);
    setUnifiedAccessControlConditions([]);
  }

  const getRenderedConditionOption = () => {
    const conditionTypeData = chain.types.conditionTypeData;

    if (selectPage === 'chooseAccess') {
      let allowedNestedConditions = [];

      if (isNested === true) {
        // conditions like POAP are already nested, so there is an option to prevent deeper nesting
        Object.keys(chain.types.conditionTypes).forEach((c, i) => {
          if ((!conditionTypeData[c].supportedChains || conditionTypeData[c].supportedChains.includes(chain.value)) &&
              (!chain['disallowNesting'] || !chain['disallowNesting'].find(n => n === c)))
          {
            allowedNestedConditions.push(<LitChooseAccessButton key={i} onClick={() => setSelectPage(c)}
                                                                label={conditionTypeData[c].label}
                                                                img={conditionTypeData[c].img}/>)
          }
        })
      } else {
        Object.keys(chain.types.conditionTypes).forEach((c, i) => {
          if (!conditionTypeData[c].supportedChains || conditionTypeData[c].supportedChains.includes(chain.value)) {
            allowedNestedConditions.push(<LitChooseAccessButton key={i} onClick={() => setSelectPage(c)}
                                                                label={conditionTypeData[c].label}
                                                                img={conditionTypeData[c].img}/>)
          }
        })
      }
      return (
        // if there is no nesting, return all conditions
        <div className={'lsm-multiple-condition-rendering-options-container'}>
          <h3 className={'lsm-multiple-condition-select-prompt'}>Choose who can
            access this:</h3>
          {allowedNestedConditions.map((c, i) => {
            return c
          })
          }
        </div>
      )
    } else {
      // check for existence of condition type before rendering it for user
      if (chain.types.conditionTypes[selectPage]) {
        const ConditionHolder = chain.types.conditionTypes[selectPage];
        return <ConditionHolder updateUnifiedAccessControlConditions={setUnifiedAccessControlConditions}
                                chain={chain}
                                initialState={initialState}
                                submitDisabled={setSubmitDisabled}/>
      } else {
        // if page type doesn't exist on this chain, redirect to choose access page
        setSelectPage('chooseAccess');
      }
    }
  }

  return (
    <div className={'lsm-multiple-condition-add-container'}>
      <LitChainSelector/>
      {!!chain && !!setSelectPage && (
        <div className={'lsm-multiple-select-condition-display'}>
          {getRenderedConditionOption()}
        </div>
      )}
      {selectPage === 'chooseAccess' && (
        <LitFooter
          backAction={() => {
            setDisplayedPage('multiple');
          }}
        />
      )}
      {selectPage !== 'chooseAccess' && (
        <LitFooter className={'lsm-single-condition-footer'}
                   backAction={backButtonAction}
                   nextAction={toggleCoordinateUpdateAccessControl}
                   disableNextButton={submitDisabled}/>
      )}
    </div>
  )

};

export default MultipleAddCondition;
