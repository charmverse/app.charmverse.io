import React, { useEffect, useContext, useState } from 'react';
import LitTokenSelect from "../../../reusableComponents/litTokenSelect/LitTokenSelect";
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { utils } from "ethers";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const EthereumSelectNFT = ({updateUnifiedAccessControlConditions, submitDisabled, chain, initialState = null}) => {
  const [ tokenId, setTokenId ] = useState("");
  const [ selectedToken, setSelectedToken ] = useState({});
  const [ contractAddress, setContractAddress ] = useState("");
  const [ addressIsValid, setAddressIsValid ] = useState(false);

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['NFTAddress']) {
        setContractAddress(initialState['NFTAddress']);
        handleSubmit(initialState['NFTAddress'])
      }
      if (initialState['NFTTokenId']) {
        setTokenId(initialState['NFTTokenId']);
      }
    }
    wipeInitialProps();
  }, [])

  useEffect(() => {
    if (!!contractAddress) {
      handleSubmit(contractAddress);
    }
  }, [ chain, tokenId, contractAddress ])

  useEffect(() => {
    if (selectedToken === null) {
      setContractAddress('');
    }
    if (selectedToken?.['value'] === 'ethereum') {
      setContractAddress('');
    }
    if (selectedToken?.['value'] && utils.isAddress(selectedToken?.['value'])) {
      setContractAddress(selectedToken['value']);
    }
  }, [ selectedToken ]);

  const handleSubmit = (address) => {
    const isValid = chain.addressValidator(address);
    setAddressIsValid(isValid);

    submitDisabled(!address || !address.length || !tokenId.length || !isValid)

    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: address,
        standardContractType: "ERC721",
        chain: chain['value'],
        method: "ownerOf",
        parameters: [ tokenId ],
        returnValueTest: {
          comparator: "=",
          value: ":userAddress",
        },
      },
    ];

    updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which NFT's
        should be able to access this asset?</h3>
      <h3 className={'lsm-condition-prompt-text'}>Select
        token or
        enter contract address</h3>
      <LitTokenSelect option={selectedToken}
                      label={(!selectedToken || !selectedToken['label']) ? 'Search for a token/NFT' : selectedToken.label}
                      selectedToken={selectedToken}
                      setSelectedToken={setSelectedToken}
      />
      <h3
        className={'lsm-condition-prompt-text'}>Contract Address</h3>
      <LitInput value={contractAddress}
                disabled={selectedToken?.['value']}
                setValue={setContractAddress}
                errorMessage={addressIsValid ? null : 'Address is invalid'}
                placeholder={'ERC721 Address'}
      />
      <h3 className={'lsm-condition-prompt-text'}>
        Add Token ID</h3>
      <LitInput value={tokenId}
                setValue={setTokenId}
      />
    </div>
  );
};

export default EthereumSelectNFT;
