import React, { Fragment, useContext, useState } from 'react';
import { colorArray } from "../helpers/colorArray";
import { ShareModalContext } from "../createShareContext";
import LitDeleteModal from "../../reusableComponents/litDeleteModal/LitDeleteModal";

const MultipleConditionsEditor = ({humanizedUnifiedAccessControlConditions, createCondition}) => {

  const {
    handleDeleteAccessControlCondition,
    updateLogicOperator,
    setDisplayedPage,
  } = useContext(ShareModalContext);

  const [ currentAccIndex, setCurrentAccIndex ] = useState(null);
  const [ accType, setAccType ] = useState(null);
  const [ showDeleteModal, setShowDeleteModal ] = useState(false);

  const handleDelete = (modalResponse) => {
    if (modalResponse === 'yes') {
      if (accType === 'paop') {
        handleDeleteAccessControlCondition(currentAccIndex[0], null)
        return;
      }
      console.log('currentAccIndex', currentAccIndex);
      currentAccIndex.length === 1 ?
        handleDeleteAccessControlCondition(currentAccIndex[0], null) :
        handleDeleteAccessControlCondition(currentAccIndex[0], currentAccIndex[1])
    }

    setCurrentAccIndex(null);
    setAccType(null);
    setShowDeleteModal(false);
  }

  const checkOperator = (operator, value) => {
    if (operator === value) {
      return 'lsm-multiple-condition-operator-selected';
    } else {
      return 'lsm-multiple-condition-operator-not-selected ';
    }
  }

  const callCreateCondition = (isNested = false, nestedIndex = null) => {
    createCondition(isNested, nestedIndex);
    setDisplayedPage('multiple-add');
  }

  return (
    <div className={'lsm-multiple-condition-editor-container'}>
      {humanizedUnifiedAccessControlConditions.length > 0 && humanizedUnifiedAccessControlConditions.map((a, i) => {
        // render POAP separately to prevent changing of OR operator
        if (Array.isArray(a)
          && a.length === 3
          && a[0].humanizedAcc.includes('POAP')
          && a[2].humanizedAcc.includes('POAP')) {
          return (
            <div
              className={'lsm-multiple-condition-group'}
              key={i}
              style={{'backgroundColor': colorArray[i / 2]}}>
              <span className={'lsm-multiple-condition-humanized-container'}>
                <span className={'lsm-multiple-condition-humanized-text'}>
                  <span>[{a[0].conditionType}] {a[0].humanizedAcc}</span>
                  <button
                    className={`lsm-multiple-condition-group-operator-poap lsm-multiple-condition-operator-selected`}>
                    OR
                  </button>
                  <span>[{a[2].conditionType}] {a[2].humanizedAcc}</span>
                </span>
                <span>
                  <button className={'lsm-multiple-condition-humanized-delete'} onClick={() => {
                    setCurrentAccIndex([ i ]);
                    setShowDeleteModal(true);
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
                          fill="#888" fillOpacity="1"/>
                    </svg>
                  </button>
                </span>
              </span>
            </div>
          )
        } else
          // if condition is nested and not POAP
        if (Array.isArray(a)) {
          return (
            <div
              className={'lsm-multiple-condition-group'}
              key={i}
              style={{'backgroundColor': colorArray[i / 2]}}>
              {a.map((n, ni) => {
                if (!n['operator']) {
                  return (
                    <span className={'lsm-multiple-condition-humanized-container'}
                          key={`n-${ni}`}>
                      <div className={'lsm-multiple-condition-humanized-text'}>
                        <span>{n.humanizedAcc}</span>
                        <span><i>chain - {n.chain} | condition type - {n.conditionType}</i></span>
                      </div>
                      <span>
                        <button className={'lsm-multiple-condition-humanized-delete'} onClick={() => {
                          console.log('CHECK DELETE', [ i, ni ]);
                          setCurrentAccIndex([ i, ni ]);
                          setShowDeleteModal(true);
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                               xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
                                fill="#888" fillOpacity="1"/>
                          </svg>
                        </button>
                      </span>
                    </span>
                  )
                } else {
                  return (
                    <span className={'lsm-multiple-condition-operator-container'}
                          key={`n-${ni}`}>
                      <button onClick={() => updateLogicOperator('and', i, ni)}
                              className={`lsm-multiple-condition-group-operator ${checkOperator('and', n['operator'])}`}>
                        AND
                      </button>
                      <button onClick={() => updateLogicOperator('or', i, ni)}
                              className={`lsm-multiple-condition-group-operator ${checkOperator('or', n['operator'])}`}>
                        OR
                      </button>
                    </span>
                  )
                }
              })}
              <button className={'lsm-multiple-condition-define-button'}
                      onClick={() => callCreateCondition(true, i)}>
                Define Another Nested Condition
              </button>
            </div>
          )
        } else if (!a['operator']) {
          // if condition is not nested
          return (
            <div
              className={'lsm-multiple-condition-group '}
              key={i}
              style={{'backgroundColor': colorArray[i / 2]}}>
              <span className={'lsm-multiple-condition-humanized-container'}>
                <div className={'lsm-multiple-condition-humanized-text'}>
                  <span>{humanizedUnifiedAccessControlConditions[i].humanizedAcc}</span>
                  <span><i>chain - {humanizedUnifiedAccessControlConditions[i].chain} | condition type - {humanizedUnifiedAccessControlConditions[i].conditionType}</i></span>
                </div>
                <span>
                  <button className={'lsm-multiple-condition-humanized-delete'} onClick={() => {
                    setCurrentAccIndex([ i ]);
                    setShowDeleteModal(true);
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
                          fill="#888" fillOpacity="1"/>
                    </svg>
                  </button>
                </span>
              </span>
              <button className={'lsm-multiple-condition-define-button'}
                      onClick={() => callCreateCondition(true, i)}>
                Define Another Nested Condition
              </button>
            </div>
          )
        } else {
          return (
            <span className={'lsm-multiple-condition-operator-container'}
                  key={i}>
              <button onClick={() => updateLogicOperator('and', i)}
                      className={`lsm-multiple-condition-group-operator ${checkOperator('and', a['operator'])}`}>
                AND
              </button>
              <button onClick={() => updateLogicOperator('or', i)}
                      className={`lsm-multiple-condition-group-operator ${checkOperator('or', a['operator'])}`}>
                OR
              </button>
            </span>
          )
        }
      })}


      {!humanizedUnifiedAccessControlConditions.length ? (
        <div className={'lsm-multiple-condition-initial-container'}>
          <span className={'lsm-multiple-condition-define-first-group'}
                style={{'backgroundColor': colorArray[0]}}>
            <button className={'lsm-multiple-condition-define-first-button'} onClick={() => callCreateCondition()}>
              Define First Condition
            </button>
          </span>
          <svg className={"lsm-multiple-condition-define-first-arrow"} width="23" height="109" viewBox="0 0 23 109"
               fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.5107 108.5C14.5107 96 5.4 68.1 5 54.5C4.6 40.9 8.51071 13 14.0107 1M14.0107 1L0.5 10M14.0107 1L20 15"
              stroke="#888" strokeOpacity="1"/>
          </svg>

          <h3 className={"lsm-multiple-condition-define-first-text"}>
            Once you've added your first condition, you can add AND/OR operators and groups
          </h3>
        </div>
      ) : (
        <Fragment>
          <span className={'lsm-multiple-condition-group'}>
            <button className={'lsm-multiple-condition-define-first-button'} onClick={() => callCreateCondition()}>
              Define Another Condition
            </button>
          </span>
        </Fragment>
      )}
      <LitDeleteModal showDeleteModal={showDeleteModal} onClick={handleDelete}/>
    </div>
  )
}

export default MultipleConditionsEditor;
