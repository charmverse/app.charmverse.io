import React, { useEffect, useContext, useState } from 'react';
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const EthereumSelectDAO = ({updateUnifiedAccessControlConditions, submitDisabled, chain, initialState = null}) => {
  const [ DAOAddress, setDAOAddress ] = useState("");
  const [ DAOName, setDAOName ] = useState(null);

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['DAOAddress'] && initialState['DAOAddress'].length) {
        setDAOAddress(initialState['DAOAddress']);
      }
      if (initialState['DAOName'] && initialState['DAOName'].length) {
        console.log(initialState['DAOName'])
        setDAOName(initialState['DAOName']);
      }
    }
    wipeInitialProps();
  }, []);

  useEffect(() => {
    if (DAOAddress.length) {
      handleSubmit()
    }
    submitDisabled(!DAOAddress.length)
  }, [ DAOAddress, chain ]);

  const handleSubmit = () => {
    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: DAOAddress,
        standardContractType: "MolochDAOv2.1",
        chain: chain.value,
        method: "members",
        parameters: [ ":userAddress" ],
        returnValueTest: {
          comparator: "=",
          value: "true",
        },
      },
    ];

    updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which DAO's
        members should be able to access this asset?</h3>
      {DAOName && initialState?.['DAOAddress'] && DAOAddress === initialState['DAOAddress'] && (
        <h3 className={'lsm-condition-prompt-text'}>DAO Name: <strong>{DAOName}</strong></h3>
      )}
      <h3 className={'lsm-condition-prompt-text'}>Add DAO
        contract address:</h3>
      <LitInput value={DAOAddress} setValue={setDAOAddress}/>
      <p className={'lsm-condition-prompt-text'}>Lit
        Gateway currently supports DAOs using the MolochDAOv2.1 contract (includes
        DAOhaus)</p>
    </div>
  );
};

export default EthereumSelectDAO;
