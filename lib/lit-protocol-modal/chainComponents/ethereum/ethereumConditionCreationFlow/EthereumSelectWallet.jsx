import React, { useState, useEffect, useContext } from 'react';
import LitJsSdk from "lit-js-sdk";
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const EthereumSelectWallet = ({
                                updateUnifiedAccessControlConditions,
                                submitDisabled,
                                chain,
                                initialState = null
                              }) => {
  const [ walletAddress, setWalletAddress ] = useState("");
  const [ loading, setLoading ] = useState(false);
  const [ errorMessage, setErrorMessage ] = useState('');

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['walletAddress']) {
        setWalletAddress(initialState['walletAddress']);
        handleSubmit(initialState['walletAddress']);
      }
    }
    wipeInitialProps();
  }, []);

  useEffect(() => {
    handleSubmit(walletAddress);
  }, [ chain, walletAddress ]);

  const handleSubmit = async (address) => {
    let resolvedAddress = address;

    if (address.toLowerCase().includes(".eth")) {
      setLoading(true);
      // do domain name lookup
      try {
        resolvedAddress = await LitJsSdk.lookupNameServiceAddress({
          chain: chain['value'],
          name: address,
        });
      } catch (err) {
        setLoading(false);
        setErrorMessage("Error connecting");
        alert(
          "Error connecting.  If using mobile, use the Metamask Mobile Browser to connect."
        );
        return;
      }
      if (!resolvedAddress) {
        // ADD_ERROR_HANDLING
        setErrorMessage("Failed to resolve ENS address");
        setLoading(false);
        return;
      }
    }

    const checkIfAddressIsValid = chain.addressValidator(resolvedAddress);

    if (!checkIfAddressIsValid) {
      setErrorMessage('Address is invalid');
    } else {
      setErrorMessage('');
    }

    submitDisabled(!resolvedAddress.length || !checkIfAddressIsValid)

    setLoading(false);


    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: "",
        standardContractType: "",
        chain: chain['value'],
        method: "",
        parameters: [ ":userAddress" ],
        returnValueTest: {
          comparator: "=",
          value: resolvedAddress,
        },
      },
    ];

    updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which wallet
        should be able to access this asset?</h3>
      <h3 className={'lsm-condition-prompt-text'}>Add Wallet
        Address or Blockchain Domain (e.g. ENS) here:</h3>
      <LitInput value={walletAddress}
                setValue={setWalletAddress}
                errorMessage={errorMessage}
                loading={loading}
      />
    </div>
  );
};

export default EthereumSelectWallet;
