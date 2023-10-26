import { MenuItem, Select } from '@mui/material';
import { Fragment, useEffect, useState, useContext } from 'react';

import { ShareModalContext } from '../../../shareModal/createShareContext';

const typesOfPoapGate = [
  {
    label: 'By POAP ID',
    id: 'eventId',
    value: '='
  },
  {
    label: 'By POAP Name',
    id: 'tokenURI',
    value: '='
  }
];

const matchConditionOptions = [
  {
    label: 'Contains POAP Name',
    id: 'contains',
    value: 'contains'
  },
  {
    label: 'Equals POAP Name exactly',
    id: 'equals',
    value: '='
  }
];

type Props = {
  submitDisabled: (disabled: boolean) => void;
  updateUnifiedAccessControlConditions: (conditions: any) => void;
  initialState?: any;
};

function EthereumSelectPOAP({ updateUnifiedAccessControlConditions, submitDisabled, initialState = null }: Props) {
  const [poapGateTypeId, setPoapGateTypeId] = useState(typesOfPoapGate[0].id);
  const [poapId, setPoapId] = useState('');
  const [poapName, setPoapName] = useState('');
  const [nameMatchConditionValue, setNameMatchConditionValue] = useState(matchConditionOptions[0].value);

  const { wipeInitialProps } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState.poapName) {
        setPoapGateTypeId(typesOfPoapGate[1].id);
        setPoapName(initialState.poapName);
        if (initialState.poapMatchCondition === 'contains') {
          setNameMatchConditionValue(matchConditionOptions[0].value);
        } else if (initialState.poapMatchCondition === 'equals') {
          setNameMatchConditionValue(matchConditionOptions[1].value);
        }
      } else if (initialState.poapId) {
        setPoapGateTypeId(typesOfPoapGate[0].id);
        setPoapId(initialState.poapId);
        setNameMatchConditionValue(matchConditionOptions[1].value);
      }
    }
    wipeInitialProps();
  }, []);

  const getComparator = (type: string) => {
    if (type === 'eventId') {
      return '=';
    } else {
      return nameMatchConditionValue;
    }
  };

  const handleSubmit = () => {
    const unifiedAccessControlConditions = [
      [
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: 'POAP',
          chain: 'xdai',
          method: poapGateTypeId,
          parameters: [],
          returnValueTest: {
            comparator: getComparator(poapGateTypeId),
            value: poapGateTypeId === 'eventId' ? poapId : poapName
          }
        },
        { operator: 'or' },
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: 'POAP',
          chain: 'ethereum',
          method: poapGateTypeId,
          parameters: [],
          returnValueTest: {
            comparator: getComparator(poapGateTypeId),
            value: poapGateTypeId === 'eventId' ? poapId : poapName
          }
        }
      ]
    ];

    updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
  };

  useEffect(() => {
    if (!poapId.length || !poapName.length || !nameMatchConditionValue) {
      handleSubmit();
    }
    submitDisabled(poapGateTypeId === 'eventId' ? !poapId.length : !poapName.length || !nameMatchConditionValue);
  }, [poapGateTypeId, poapId, poapName, nameMatchConditionValue]);

  return (
    <div className='lsm-condition-container'>
      <h3 className='lsm-condition-prompt-text'>Which POAP should be able to access this asset?</h3>
      <h3 className='lsm-condition-prompt-text'>How would you like to reference this POAP?</h3>
      <Select defaultValue={typesOfPoapGate[0].id} onChange={(e) => setPoapGateTypeId(e.target.value)}>
        {typesOfPoapGate.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.label}
          </MenuItem>
        ))}
      </Select>
      {poapGateTypeId === 'eventId' && (
        <>
          <h3 className='lsm-condition-prompt-text'>POAP ID:</h3>
          <input type='number' value={poapId} onChange={(e) => setPoapId(e.target.value)} className='lsm-input' />
        </>
      )}
      {poapGateTypeId === 'tokenURI' && (
        <>
          <h3 className='lsm-condition-prompt-text'>Match conditions:</h3>
          <Select
            defaultValue={matchConditionOptions[0].value}
            onChange={(e) => setNameMatchConditionValue(e.target.value)}
          >
            {matchConditionOptions.map((t) => (
              <MenuItem key={t.id} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
          <h3 className='lsm-condition-prompt-text'>POAP Name:</h3>
          <input
            value={poapName}
            onChange={(e) => setPoapName(e.target.value)}
            className='lsm-border-brand-4 lsm-input'
          />
        </>
      )}
    </div>
  );
}

export default EthereumSelectPOAP;
