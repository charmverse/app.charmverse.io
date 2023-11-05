import React, { useContext, useState, useEffect, Fragment } from 'react';
import { ShareModalContext } from "../createShareContext";
import LitChainSelector from "../../reusableComponents/litChainSelector/LitChainSelector.jsx";
import LitChooseAccessButton from "../../reusableComponents/litChooseAccessButton/LitChooseAccessButton.jsx";
import LitFooter from "../../reusableComponents/litFooter/LitFooter.jsx";

const SingleConditionSelect = ({chain, initialState = null, initialCondition = null}) => {
  const {
    handleUpdateUnifiedAccessControlConditions,
    setDisplayedPage,
    setFlow,
  } = useContext(ShareModalContext);
  const [ selectPage, setSelectPage ] = useState('chooseAccess');
  const [ unifiedAccessControlConditions, setUnifiedAccessControlConditions ] = useState([]);
  const [ submitDisabled, setSubmitDisabled ] = useState(true);

  useEffect(() => {
    if (initialCondition) {
      setSelectPage(initialCondition);
    }
  }, []);

  const coordinateUpdateAccessControl = () => {
    handleUpdateUnifiedAccessControlConditions(unifiedAccessControlConditions);
    setUnifiedAccessControlConditions([]);
    setSelectPage('chooseAccess');
    setDisplayedPage('review');
  }

  const backButtonAction = () => {
    setSelectPage('chooseAccess');
    setUnifiedAccessControlConditions([]);
  }

  const getRenderedConditionOption = () => {
    const conditionTypeData = chain.types.conditionTypeData;

    if (selectPage === 'chooseAccess') {
      return <div className={'lsm-single-condition-rendering-options-container'}>
        <h3 className={'lsm-single-condition-select-prompt'}>Choose who can
          access this:</h3>
        {
          Object.keys(chain.types.conditionTypes).map((c, i) => {
            if (!conditionTypeData[c].supportedChains || conditionTypeData[c].supportedChains.includes(chain.value)) {
              return <LitChooseAccessButton key={i} onClick={() => setSelectPage(c)} label={conditionTypeData[c].label}
                                            img={conditionTypeData[c].img}/>
            } else {
              return null
            }
          })
        }
      </div>
    } else {
      if (chain.types.conditionTypes[selectPage]) {
        const ConditionHolder = chain.types.conditionTypes[selectPage];
        return <ConditionHolder updateUnifiedAccessControlConditions={setUnifiedAccessControlConditions}
                                chain={chain}
                                initialState={initialState}
                                submitDisabled={setSubmitDisabled}/>
      } else {
        setSelectPage('chooseAccess');
      }
    }
  }

  return (
    <div className={'lsm-single-condition-select-container'}>
      <LitChainSelector/>
      {!!chain && (
        <div className={'lsm-single-select-condition-display'}>
          {getRenderedConditionOption()}
        </div>
      )}
      {selectPage === 'chooseAccess' && (
        <button className={'lsm-single-condition-multiple-button'}
                onClick={() => {
                  setFlow('multipleConditions');
                  setDisplayedPage('multiple');
                }}>
          <img src={`/images/venn.svg`}/>
          <p
            className={''}>
            Gate with multiple conditions using AND/OR operators
            {/*Gate with multiple conditions*/}
          </p>
        </button>
      )}
      {selectPage !== 'chooseAccess' && (
        <LitFooter className={'lsm-single-condition-footer'}
                   backAction={backButtonAction}
                   nextAction={coordinateUpdateAccessControl}
                   disableNextButton={submitDisabled}/>
      )}
    </div>
  )

};

export default SingleConditionSelect;
