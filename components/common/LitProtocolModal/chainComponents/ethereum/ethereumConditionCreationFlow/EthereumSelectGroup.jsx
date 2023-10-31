import React, { useContext, useEffect, useState, Fragment } from 'react';
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { logDevError } from "../../../shareModal/helpers/helperFunctions";
import { ShareModalContext } from "../../../shareModal/createShareContext";
import { decimalPlaces } from "@lit-protocol/misc"
import { Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { isAddress, parseUnits, parseEther } from 'viem';
const nativeTokenOption = {
  label: 'Ethereum',
  value: 'ethereum',
  standard: 'ethereum',
};

const EthereumSelectGroup = ({
  updateUnifiedAccessControlConditions,
  submitDisabled,
  chain,
  initialState = null
}) => {
  const [ amount, setAmount ] = useState("");
  const [ selectedToken, setSelectedToken ] = useState(nativeTokenOption);
  const [ contractAddress, setContractAddress ] = useState("");
  const [ contractType, setContractType ] = useState("");
  const [ erc1155TokenId, setErc1155TokenId ] = useState("");

  // const [ erc1155TokenIdIsValid, setErc1155TokenIdIsValid ] = useState(false);
  const [ addressIsValid, setAddressIsValid ] = useState(false);

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['groupAddress']) {
        setContractAddress(initialState['groupAddress']);
      }
      if (initialState['groupContractType']) {
        handleChangeContractType(initialState['groupContractType'].toUpperCase());
      }
      if (initialState['groupAmount']) {
        setAmount(initialState['groupAmount']);
      }
      if (initialState['groupErc1155TokenId']) {
        setErc1155TokenId(initialState['groupErc1155TokenId'])
      }
    }
    wipeInitialProps();
  }, [])

  useEffect(() => {
    if (selectedToken === null) {
      setContractAddress('');
      setContractType('');
    }
    if (selectedToken?.['value'] === 'ethereum') {
      setContractAddress('');
    }
    if (selectedToken?.['value'] && isAddress(selectedToken?.['value'])) {
      setContractAddress(selectedToken['value']);
    }
    // Disabled - contractType should only be ERC20, ERC721, or ERC1155, and selectedToken['standard'] is used for Ethereum balance
    // if (selectedToken?.['standard']) {
    //   setContractType(selectedToken['standard'].toUpperCase());
    // }
  }, [ selectedToken ]);

  useEffect(() => {
    if (contractAddress.length && !!selectedToken && (contractAddress !== selectedToken['value'])) {
      setSelectedToken({});
    }

    const contractIsValid = chain.addressValidator(contractAddress);
    setAddressIsValid(contractIsValid);
  }, [ contractAddress ]);

  // useEffect(() => {
  //   const erc1155IsValid = utils.isAddress(erc1155TokenId);
  //   setErc1155TokenIdIsValid(erc1155IsValid);
  // }, [ erc1155TokenId ])

  const isInvalid = () => {
    if (selectedToken?.['value'] === 'ethereum') {
      return !amount;
    }
    console.log(contractType)
    return !amount ||
      !addressIsValid ||
      !contractAddress.length ||
      !contractType.length ||
      (contractType === 'ERC1155' && !erc1155TokenId.length)
  }

  useEffect(() => {
    const isDisabled = isInvalid();
    handleSubmit();
    submitDisabled(isDisabled);
  }, [ amount, addressIsValid, contractAddress, chain, selectedToken, contractType, erc1155TokenId ]);


  const checkEthereum = () => {
    // ethereum
    const amountInWei = parseEther(amount);
    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: "",
        standardContractType: "",
        chain: chain['value'],
        method: "eth_getBalance",
        parameters: [ ":userAddress", "latest" ],
        returnValueTest: {
          comparator: ">=",
          value: amountInWei.toString(),
        },
      },
    ];
    saveCondition(unifiedAccessControlConditions);
  }

  const checkERC1155 = () => {
    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: contractAddress,
        standardContractType: contractType,
        chain: chain['value'],
        method: "balanceOf",
        parameters: [ ":userAddress", erc1155TokenId ],
        returnValueTest: {
          comparator: ">=",
          value: amount.toString(),
        },
      },
    ];
    saveCondition(unifiedAccessControlConditions);
  }

  const checkERC721 = () => {
    const unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: contractAddress,
        standardContractType: contractType,
        chain: chain['value'],
        method: "balanceOf",
        parameters: [ ":userAddress" ],
        returnValueTest: {
          comparator: ">=",
          value: amount.toString(),
        },
      },
    ];
    saveCondition(unifiedAccessControlConditions);
  }

  const checkERC20 = async () => {
    let decimals = 0;
    let unifiedAccessControlConditions;
    try {
      decimals = await decimalPlaces({
        chain: chain['value'],
        contractAddress: contractAddress,
      });
    } catch (e) {
      // context.setError(e);
      logDevError(e)
    }

    let amountInBaseUnit;
    try {
      amountInBaseUnit = parseUnits(amount, decimals);
    } catch (err) {
      logDevError(err)
    }

    unifiedAccessControlConditions = [
      {
        conditionType: 'evmBasic',
        contractAddress: contractAddress,
        standardContractType: contractType,
        chain: chain['value'],
        method: "balanceOf",
        parameters: [ ":userAddress" ],
        returnValueTest: {
          comparator: ">=",
          value: amountInBaseUnit.toString(),
        },
      },
    ];
    saveCondition(unifiedAccessControlConditions);
  }

  const saveCondition = (uacc) => {
    updateUnifiedAccessControlConditions(uacc);
  }

  const handleSubmit = async () => {
    if (isInvalid()) {
      return;
    }


    if (selectedToken && selectedToken.value === "ethereum") {
      checkEthereum();
    } else if (contractType === "ERC1155") {
      checkERC1155();
    } else if (contractType === "ERC721") {
      checkERC721();
    } else if (contractType === "ERC20") {
      await checkERC20();
    }
  };

  const handleChangeContractType = (value) => {
    console.log('handleChangeContractType', value)
    setContractType(value);
  };

  const [value, setValue] = useState('native_token');
  const handleChange = (event) => {
    setValue(event.target.value);
    if (event.target.value === 'native_token') {
      setSelectedToken(nativeTokenOption);
    }
    else {
      setSelectedToken({});
    }
  };

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which group
        should be able to access this asset?</h3>
      <RadioGroup
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel value='native_token' control={<Radio />} label={`Check balance of ${chain.nativeToken || 'native token'}`} />
        <FormControlLabel value='custom_token' control={<Radio />} label='Custom token' />
      </RadioGroup>
      {selectedToken?.['value'] !== 'ethereum' && (
        <Fragment>
          <h3
            className={'lsm-condition-prompt-text'}>Contract Address</h3>
          <LitInput value={contractAddress}
                    disabled={selectedToken?.['value']}
                    setValue={setContractAddress}
                    errorMessage={addressIsValid ? null : 'Address is invalid'}
                    placeholder={'ERC20 or ERC721 or ERC1155 address'}
          />
          {(!!contractAddress.length && addressIsValid) && (
            <div className={''}>
              <h3
                className={'lsm-condition-prompt-text'}>Token
                Contract Type:</h3>
              <span onChange={(e) => handleChangeContractType(e.target.value)}
                    className={'lsm-radio-container'}>
                <div>
                  <label className={'lsm-radio-label'} htmlFor="erc20">
                    <input disabled={selectedToken?.['standard'] && selectedToken?.standard === contractType} readOnly
                         checked={contractType === 'ERC20'} type="radio" id="erc20"
                         name="addressType"
                         value="ERC20"/>ERC20
                  </label>
                </div>

                <div>
                  <label className={'lsm-radio-label'} htmlFor="erc721">
                    <input disabled={selectedToken?.['standard'] && selectedToken?.standard === contractType} readOnly
                         checked={contractType === 'ERC721'} type="radio" id="erc721" name="addressType"
                         value="ERC721"/>ERC721
                  </label>
                </div>

                <div>
                  <label className={'lsm-radio-label'} htmlFor="erc1155">
                    <input disabled={selectedToken?.['standard'] && selectedToken?.standard === contractType} readOnly
                         checked={contractType === 'ERC1155'} type="radio" id="erc1155" name="addressType"
                         value="ERC1155"/>ERC1155
                  </label>
                </div>
              </span>
            </div>
          )}
          {(!!contractAddress.length && contractType === 'ERC1155') && (
            <LitInput value={erc1155TokenId} setValue={setErc1155TokenId}
                      placeholder={'ERC1155 Token Id'}
            />
          )}
        </Fragment>
      )}
      <h3 className={'lsm-condition-prompt-text'}>How many tokens
        does the wallet need to own?</h3>
      <LitInput value={amount} setValue={e => setAmount(e)}
                errorMessage={isNaN(parseFloat(amount)) ? 'Must be a number' : null}
                placeholder={'##'}
      />
    </div>
  );
};

export default EthereumSelectGroup;
