import { useContext, useState } from 'react';
import LitFooter from "../../reusableComponents/litFooter/LitFooter";
import { ShareModalContext } from "../createShareContext";
import LitConfirmationModal from "../../reusableComponents/litConfirmationModal/LitConfirmationModal";
import { colorArray } from "../helpers/colorArray";
import LitCheckbox from "../../reusableComponents/litCheckbox/LitCheckbox";

const ReviewConditions = ({humanizedUnifiedAccessControlConditions }) => {
  const {
    sendUnifiedAccessControlConditions,
    flow,
    resetModal,
    setDisplayedPage,
  } = useContext(ShareModalContext);

  const [ showConfirmationModal, setShowConfirmationModal ] = useState(false);
  const [ conditionsArePermanent, setConditionsArePermanent ] = useState(true);

  const navigateBack = () => {
    if (flow === 'singleCondition') {
      setShowConfirmationModal(true);
    } else if (flow === 'multipleConditions') {
      setDisplayedPage('multiple');
    }
  }

  const handleConfirmGoBack = (modalResponse) => {
    if (modalResponse === 'yes') {
      resetModal();
    }

    setShowConfirmationModal(false);
  }

  const getOperatorAndCondition = (humanAccEntry, key) => {
    if (!humanAccEntry['operator']) {
      return (
        <div
          className={'lsm-review-condition-humanized-text'}
          key={`${humanAccEntry[0]}-${humanAccEntry.conditionType[0]}-${key}`}>
          <span>{humanAccEntry.humanizedAcc}</span>
          <span><i>chain - {humanAccEntry.chain} | condition type - {humanAccEntry.conditionType}</i></span>
        </div>
      )
    } else if (humanAccEntry['operator']) {
      return (
        <span
          className={'lsm-review-condition-operator-text'}
          key={`n-${key}`}>
            {humanAccEntry.operator === 'and' ? 'AND' : 'OR'}
          </span>
      )
    }
  }

  const recursiveRenderConditionsGroups = (humanAcc, depth = 0, index = 0) => {
    return (
      <div className={'lsm-review-conditions-group '}
           key={`${depth}-${index}}`}
           style={{'backgroundColor': colorArray[Math.ceil((depth) / 2)]}}>
        {Array.isArray(humanAcc) ? (humanAcc.map((h, i) => {
            if (Array.isArray(h)) {
              return recursiveRenderConditionsGroups(h, depth, i)
            } else {
              return getOperatorAndCondition(h, depth + i)
            }
          })
        ) : (
          getOperatorAndCondition(humanAcc, depth)
        )}
      </div>
    )
  }

  return (
    <div className={'lsm-review-conditions-container'}>
      <div className={'lsm-review-conditions-group-container'}>
        <h3
          className={'lsm-review-conditions-prompt'}>Review your conditions and confirm at bottom
        </h3>
        {!!humanizedUnifiedAccessControlConditions && (
          recursiveRenderConditionsGroups(humanizedUnifiedAccessControlConditions)
        )}
        <footer className={'lsm-review-conditions-footer'}>
          <LitCheckbox value={conditionsArePermanent}
                       checked={conditionsArePermanent}
                       setValue={setConditionsArePermanent}
                       label={'Make condition(s) permanent; if selected, you cannot update them later'}/>
          <div className={'lsm-review-conditions-link'}>
            <a href={'https://developer.litprotocol.com/docs/AccessControlConditions/evmBasicExamples'}
               target={'_blank'}
               rel="noreferrer">More information about
              conditions<img
                alt={'clear input'} className={'lsm-review-conditions-link-icon'} src={'/images/link.svg'}/></a>
          </div>
        </footer>
      </div>
      <LitFooter backAction={() => navigateBack()}
                 nextAction={() => {
                   sendUnifiedAccessControlConditions(conditionsArePermanent);
                 }}
                 disableNextButton={false}
                 nextButtonLabel={'DONE'}/>
      <LitConfirmationModal showConfirmationModal={showConfirmationModal}
                            onClick={handleConfirmGoBack}/>
    </div>
  )
}

export default ReviewConditions;
