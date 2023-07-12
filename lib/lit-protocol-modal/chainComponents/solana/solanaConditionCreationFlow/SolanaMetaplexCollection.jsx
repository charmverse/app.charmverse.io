import React, { useContext, useState, useEffect } from 'react';
import { ShareModalContext } from "../../../shareModal/createShareContext.js";
import LitInput from "../../../reusableComponents/litInput/LitInput";

const SolanaMetaplexCollection = ({updateUnifiedAccessControlConditions, submitDisabled, initialState = null}) => {
  const context = useContext(ShareModalContext);
  const [ amount, setAmount ] = useState("");
  const [ contractAddress, setContractAddress ] = useState("");

  const {
    wipeInitialProps,
  } = useContext(ShareModalContext);

  useEffect(() => {
    if (initialState) {
      if (initialState['solMetaplexAddress']) {
        setContractAddress(initialState['solMetaplexAddress']);
      }
    }
    wipeInitialProps();
  }, []);

  useEffect(() => {
    submitDisabled(!amount || !contractAddress.length);
    handleSubmit();
  }, [ amount, contractAddress ])

  const handleSubmit = async () => {
    if (contractAddress && contractAddress.length) {
      const unifiedAccessControlConditions = [
        {
          conditionType: 'solRpc',
          method: "balanceOfMetaplexCollection",
          params: [ contractAddress ],
          chain: 'solana',
          pdaParams: [],
          pdaInterface: {offset: 0, fields: {}},
          pdaKey: "",
          returnValueTest: {
            key: "",
            comparator: ">=",
            value: amount,
          },
        },
      ];

      updateUnifiedAccessControlConditions(unifiedAccessControlConditions);
    }
  }

  return (
    <div className={'lsm-condition-container'}>
      <h3 className={'lsm-condition-prompt-text'}>Which group
        should be able to access this asset?</h3>
      <h3 className={'lsm-condition-prompt-text'}>Enter Metaplex collection address:</h3>
      <LitInput value={contractAddress}
                setValue={setContractAddress}
                placeholder={'NFT or group address'}
      />
      <h3 className={'lsm-condition-prompt-text'}>How many tokens
        does the wallet need to own?</h3>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={'##'}
             className={'lsm-border-brand-4 lsm-input'}/>
      <h3 className={'lsm-condition-prompt-text'}><a
        href={'https://support.opensea.io/hc/en-us/articles/5661749143571-Getting-my-Solana-collection-on-OpenSea-Understanding-the-Metaplex-Certified-Collection-standard'}
        target={'_blank'}>More information on Metaplex collections.</a></h3>
    </div>
  );
};

export default SolanaMetaplexCollection;
