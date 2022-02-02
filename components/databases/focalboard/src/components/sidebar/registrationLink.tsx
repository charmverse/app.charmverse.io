// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'

import {IWorkspace} from '../../blocks/workspace'
import {sendFlashMessage} from '../../components/flashMessages'
import client from '../../octoClient'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'
import {getCurrentWorkspace, fetchWorkspace} from '../../store/workspace'
import {useAppSelector, useAppDispatch} from '../../store/hooks'

import Modal from '../modal'

import './registrationLink.scss'

type Props = {
    onClose: () => void
}

const RegistrationLink = React.memo((props: Props) => {
    const {onClose} = props
    const intl = useIntl()
    const workspace = useAppSelector<IWorkspace|null>(getCurrentWorkspace)
    const dispatch = useAppDispatch()

    const [wasCopied, setWasCopied] = useState(false)

    useEffect(() => {
        dispatch(fetchWorkspace())
    }, [])

    const regenerateToken = async () => {
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'RegistrationLink.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            await client.regenerateWorkspaceSignupToken()
            await dispatch(fetchWorkspace())
            setWasCopied(false)

            const description = intl.formatMessage({id: 'RegistrationLink.tokenRegenerated', defaultMessage: 'Registration link regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }

    const registrationUrl = Utils.buildURL('/register?t=' + workspace?.signupToken, true)

    return (
        <Modal
            position='bottom-right'
            onClose={onClose}
        >
            <div className='RegistrationLink'>
                {workspace && <>
                    <div className='row'>
                        {intl.formatMessage({id: 'RegistrationLink.description', defaultMessage: 'Share this link for others to create accounts:'})}
                    </div>
                    <div className='row'>
                        <a
                            className='shareUrl'
                            href={registrationUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            {registrationUrl}
                        </a>
                        <Button
                            filled={true}
                            size='small'
                            onClick={() => {
                                Utils.copyTextToClipboard(registrationUrl)
                                setWasCopied(true)
                            }}
                        >
                            {wasCopied ? intl.formatMessage({id: 'RegistrationLink.copiedLink', defaultMessage: 'Copied!'}) : intl.formatMessage({id: 'RegistrationLink.copyLink', defaultMessage: 'Copy link'})}
                        </Button>
                    </div>
                    <div className='row'>
                        <Button
                            onClick={regenerateToken}
                            emphasis='secondary'
                            size='small'
                        >
                            {intl.formatMessage({id: 'RegistrationLink.regenerateToken', defaultMessage: 'Regenerate token'})}
                        </Button>
                    </div>
                </>}
            </div>
        </Modal>
    )
})

export default RegistrationLink
