import React, { useContext, useState, useEffect, Fragment } from 'react';
import LitFooter from "../../reusableComponents/litFooter/LitFooter";
import { ShareModalContext } from "../createShareContext";
import MultipleConditionsEditor from "./MultipleConditionsEditor";
import MultipleAddCondition from "./MultipleAddCondition";
import LitConfirmationModal from "../../reusableComponents/litConfirmationModal/LitConfirmationModal";

const MultipleConditionSelect = ({
                                   humanizedUnifiedAccessControlConditions,
                                   chain,
                                   initialState = null,
                                   initialCondition = null
                                 }) => {
  const {
    setDisplayedPage,
    setFlow,
    displayedPage,
    resetModal,
    handleUpdateUnifiedAccessControlConditions
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialCondition) {
      setSelectPage(initialCondition);
    }
  }, []);

  const [ showConfirmationModal, setShowConfirmationModal ] = useState(false);
  const [ isNested, setIsNested ] = useState(false);
  const [ nestedIndex, setNestedIndex ] = useState(null);

  const [ selectPage, setSelectPage ] = useState('chooseAccess');

  const handleConfirmGoBack = (modalResponse) => {
    if (modalResponse === 'yes') {
      resetModal();
    }

    setShowConfirmationModal(false);
  }

  const coordinateUpdateAccessControl = (unifiedAccessControlConditions) => {
    handleUpdateUnifiedAccessControlConditions(unifiedAccessControlConditions, isNested, nestedIndex);
    setSelectPage('chooseAccess');
    setDisplayedPage('multiple');
  }

  const createCondition = (isNested = false, nestedIndex = null) => {
    setIsNested(isNested);
    setNestedIndex(nestedIndex);
  }

  const endOfCreateCondition = (unifiedAccessControlConditions) => {
    coordinateUpdateAccessControl(unifiedAccessControlConditions)
    setIsNested(false);
    setNestedIndex(null);
  }

  return (
    <div className={'lsm-multiple-conditions-container'}>
      {displayedPage === 'multiple' && (
        <Fragment>
          <MultipleConditionsEditor humanizedUnifiedAccessControlConditions={humanizedUnifiedAccessControlConditions}
                                    createCondition={createCondition}
          />
          <LitFooter
            backAction={() => {
              if (humanizedUnifiedAccessControlConditions.length < 1) {
                setFlow('singleCondition');
                setDisplayedPage('single');
              } else {
                setShowConfirmationModal(true);
              }
            }}
            nextAction={() => setDisplayedPage('review')}
            disableNextButton={!humanizedUnifiedAccessControlConditions || !humanizedUnifiedAccessControlConditions.length}
          />
        </Fragment>
      )}
      {displayedPage === 'multiple-add' && (
        <MultipleAddCondition selectPage={selectPage}
                              setSelectPage={setSelectPage}
                              chain={chain}
                              initialCondition={initialCondition}
                              initialState={initialState}
                              isNested={isNested}
                              endOfCreateCondition={endOfCreateCondition}/>
      )}
      <LitConfirmationModal showConfirmationModal={showConfirmationModal}
                            onClick={handleConfirmGoBack}/>
    </div>
  )
}

export default MultipleConditionSelect;
