import React, { useState, useEffect, useContext } from 'react';
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const SolanaSelectWallet = ({updateUnifiedAccessControlConditions, submitDisabled, initialState = null}) => {
  const [ walletAddress, setWalletAddress ] = useState("");

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['solWalletAddress']) {
        setWalletAddress(initialState['solWalletAddress']);
      }
    }
    wipeInitialProps();
  }, []);

  useEffect(() => {
    handleSubmit();
    submitDisabled(!walletAddress.length);
  }, [ walletAddress ])

  const handleSubmit = async () => {
    let resolvedAddress = walletAddress;

    const solRpcConditions = [
      {
        conditionType: 'solRpc',
        method: "",
        params: [ ":userAddress" ],
        chain: 'solana',
        pdaParams: [],
        pdaInterface: {offset: 0, fields: {}},
        pdaKey: "",
        returnValueTest: {
          key: "",
          comparator: "=",
          value: resolvedAddress,
        },
      },
    ];

    updateUnifiedAccessControlConditions(solRpcConditions);
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which wallet
        should be able to access this asset?</h3>
      <h3 className={'lsm-condition-prompt-text'}>
        Add Wallet Address here:</h3>
      <LitInput value={walletAddress}
                setValue={setWalletAddress}
      />
    </div>
  );
}


export default SolanaSelectWallet;
