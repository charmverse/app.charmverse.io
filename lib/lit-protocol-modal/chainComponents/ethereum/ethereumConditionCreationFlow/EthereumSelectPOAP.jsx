import React, { Fragment, useEffect, useState, useContext } from 'react';
import Select from "react-select";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const typesOfPoapGate = [
  {
    label: "By POAP ID",
    id: "eventId",
    value: "=",
  },
  {
    label: "By POAP Name",
    id: "tokenURI",
    value: "=",
  },
];


const matchConditionOptions = [
  {
    label: "Contains POAP Name",
    id: "contains",
    value: "contains",
  },
  {
    label: "Equals POAP Name exactly",
    id: "equals",
    value: "=",
  },
];

const EthereumSelectPOAP = ({updateUnifiedAccessControlConditions, submitDisabled, initialState = null}) => {
  const [ poapGateType, setPoapGateType ] = useState(typesOfPoapGate[0]);
  const [ poapId, setPoapId ] = useState("");
  const [ poapName, setPoapName ] = useState("");
  const [ nameMatchCondition, setNameMatchCondition ] = useState(matchConditionOptions[0]);

  const [ render, setRender ] = useState(false);

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['poapName']) {
        setPoapGateType(typesOfPoapGate[1]);
        setPoapName(initialState['poapName']);
        if (initialState['poapMatchCondition'] === 'contains') {
          setNameMatchCondition(matchConditionOptions[0]);
        } else if (initialState['poapMatchCondition'] === 'equals') {
          setNameMatchCondition(matchConditionOptions[1]);
        }
      } else if (initialState['poapId']) {
        setPoapGateType(typesOfPoapGate[0]);
        setPoapId(initialState['poapId']);
        setNameMatchCondition(matchConditionOptions[1]);
      }
    }
    setRender(true);
    wipeInitialProps();
  }, []);

  useEffect(() => {
    if (!poapId.length || (!poapName.length || !nameMatchCondition)) {
      handleSubmit();
    }
    submitDisabled(poapGateType.id === 'eventId' ? !poapId.length : (!poapName.length || !nameMatchCondition));
  }, [ poapGateType, poapId, poapName, nameMatchCondition ]);


  const getComparator = (type) => {
    if (type === 'eventId') {
      return '=';
    } else {
      return nameMatchCondition.value;
    }
  }

  const handleSubmit = () => {
    const unifiedAccessControlConditions = [ [
      {
        conditionType: 'evmBasic',
        contractAddress: "0x22C1f6050E56d2876009903609a2cC3fEf83B415",
        standardContractType: "POAP",
        chain: "xdai",
        method: poapGateType.id,
        parameters: [],
        returnValueTest: {
          comparator: getComparator(poapGateType.id),
          value: poapGateType.id === 'eventId' ? poapId : poapName,
        },
      },
      {operator: "or"},
      {
        conditionType: 'evmBasic',
        contractAddress: "0x22C1f6050E56d2876009903609a2cC3fEf83B415",
        standardContractType: "POAP",
        chain: "ethereum",
        method: poapGateType.id,
        parameters: [],
        returnValueTest: {
          comparator: getComparator(poapGateType.id),
          value: poapGateType.id === 'eventId' ? poapId : poapName,
        },
      },
    ] ];


    updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which POAP
        should be able to access this asset?</h3>
      <h3 className={'lsm-condition-prompt-text'}>How would you like to reference this POAP?</h3>
      <Select
        className={'lsm-reusable-select'}
        classNamePrefix={'lsm'}
        options={typesOfPoapGate}
        defaultValue={typesOfPoapGate[0]}
        isSeachable={false}
        onChange={(c) => setPoapGateType(c)}
      />
      {poapGateType.id === 'eventId' && (
        <Fragment>
          <h3
            className={'lsm-condition-prompt-text'}>
            POAP ID:</h3>
          <input type={'number'} value={poapId} onChange={(e) => setPoapId(e.target.value)}
                 className={'lsm-input'}/>
        </Fragment>
      )}
      {poapGateType.id === 'tokenURI' && (
        <Fragment>
          <h3 className={'lsm-condition-prompt-text'}>POAP Name:</h3>
          <input value={poapName} onChange={(e) => setPoapName(e.target.value)}
                 className={'lsm-border-brand-4 lsm-input'}/>
          <h3 className={'lsm-condition-prompt-text'}>Match
            conditions:</h3>
          <Select
            className={'lsm-reusable-select'}
            classNamePrefix={'lsm'}
            options={matchConditionOptions}
            defaultValue={nameMatchCondition}
            isSeachable={false}
            onChange={(c) => setNameMatchCondition(c)}
          />
        </Fragment>
      )}
    </div>
  );
};

export default EthereumSelectPOAP;
