import React, { useEffect, useContext, useState } from 'react';
import LitInput from "../../../reusableComponents/litInput/LitInput";
import { utils } from "ethers";
import { ShareModalContext } from "../../../shareModal/createShareContext";

const caskContractMap = {
    polygon: '0x4A6f232552E0fd76787006Bb688bFBCB931cc3d0',
    avalanche: '0x4A6f232552E0fd76787006Bb688bFBCB931cc3d0',
    fuji: '0x921ec72BEf414D75F0C6fFee37975BB3ae80d41C',
    mumbai: '0xaC7331DF9CB75beC251b75647AEccdeA8d336e33',
    fantom: '0x7DaF9a1744Df00d0473A9A920B6A4Ea33B665360',
    aurora: '0xD054F8866fc45c4387d56D2340dCA08d83E14A5e',
    xdai: '0xD054F8866fc45c4387d56D2340dCA08d83E14A5e',
};

const EthereumSelectCask = ({updateUnifiedAccessControlConditions, submitDisabled, chain, initialState = null}) => {
    const [ providerAddress, setProviderAddress ] = useState("");
    const [ addressIsValid, setAddressIsValid ] = useState(false);
    const [ providerPlan, setProviderPlan ] = useState("");
    const [ planIsValid, setPlanIsValid ] = useState(false);

    const {
        wipeInitialProps,
    } = useContext(ShareModalContext);

    useEffect(() => {
        if (initialState) {
            if (initialState['CaskProviderAddress']) {
                setProviderAddress(initialState['CaskProviderAddress']);
            }
            if (initialState['CaskPlanId']) {
                setProviderPlan(initialState['CaskPlanId']);
            }
            handleSubmit(initialState['CaskProviderAddress'], initialState['CaskPlanId'])
        }
        wipeInitialProps();
    }, [])

    useEffect(() => {
        handleSubmit(providerAddress, providerPlan);
    }, [ chain, providerAddress, providerPlan ]);

    const handleSubmit = (address, plan) => {

        const checkIfAddressIsValid = utils.isAddress(address);
        setAddressIsValid(checkIfAddressIsValid);
        const checkIfPlanIsValid = !isNaN(plan);
        setPlanIsValid(checkIfPlanIsValid);

        submitDisabled(!checkIfAddressIsValid || !checkIfPlanIsValid)

        const unifiedAccessControlConditions = [
            {
                conditionType: "evmBasic",
                contractAddress: caskContractMap[chain['value']],
                standardContractType: "CASK",
                method: "getActiveSubscriptionCount",
                parameters: [":userAddress", address, plan],
                chain: chain['value'],
                returnValueTest: {
                    comparator: ">=",
                    value: "1",
                },
            },
        ];

        updateUnifiedAccessControlConditions(unifiedAccessControlConditions);

    };

    return (
        <div className={'lsm-condition-container'}>
            <h3 className={'lsm-condition-prompt-text'}>
                This access control allows you to gate access to users who have an active
                subscription, contribution or other money flow. It is powered by the
                decentralized <a href={'https://www.cask.fi'} target={'_blank'}>Cask Protocol</a>.
                &nbsp;<a href={'https://docs.cask.fi'} target={'_blank'}>Learn more</a>.
            </h3>
            <h3 className={'lsm-condition-prompt-text'}>Cask Provider Address</h3>
            <LitInput value={providerAddress}
                      setValue={setProviderAddress}
                      errorMessage={addressIsValid ? null : 'Address is invalid'}
                      placeholder={'Cask Provider Address'}
            />
            <h3
                className={'lsm-condition-prompt-text'}>Cask Plan ID</h3>
            <LitInput value={providerPlan}
                      setValue={setProviderPlan}
                      errorMessage={planIsValid ? null : 'Invalid plan ID - must be a numeric Cask plan ID'}
                      placeholder={'Cask Plan ID'}
            />
        </div>
    );
};

export default EthereumSelectCask;
