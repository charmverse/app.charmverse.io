// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import { useRouter } from 'next/router';

import {Constants} from '../../constants'
import octoClient from '../../octoClient'
import {IUser} from '../../user'
import FocalboardLogoIcon from '../../widgets/icons/focalboard_logo'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {getMe} from '../../store/users'
import {useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'

import ModalWrapper from '../modalWrapper'

import {IAppWindow} from '../../types'

import RegistrationLink from './registrationLink'


declare let window: IAppWindow

const SidebarUserMenu = React.memo(() => {
    const router = useRouter()
    const [showRegistrationLinkDialog, setShowRegistrationLinkDialog] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)
    const intl = useIntl()

    if (Utils.isFocalboardPlugin()) {
        return <></>
    }
    return (
        <div className='SidebarUserMenu'>
            <ModalWrapper>
                <MenuWrapper>
                    <div className='logo'>
                        <div className='logo-title'>
                            <FocalboardLogoIcon/>
                            <span>{'Focalboard'}</span>
                            <div className='versionFrame'>
                                <div
                                    className='version'
                                    title={`v${Constants.versionString}`}
                                >
                                    {Constants.versionDisplayString}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Menu>
                        {user && user.username !== 'single-user' && <>
                            <Menu.Label><b>{user.username}</b></Menu.Label>
                            <Menu.Text
                                id='logout'
                                name={intl.formatMessage({id: 'Sidebar.logout', defaultMessage: 'Log out'})}
                                onClick={async () => {
                                    await octoClient.logout()
                                    router.push('/login')
                                }}
                            />
                            <Menu.Text
                                id='changePassword'
                                name={intl.formatMessage({id: 'Sidebar.changePassword', defaultMessage: 'Change password'})}
                                onClick={async () => {
                                    router.push('/change_password')
                                }}
                            />
                            <Menu.Text
                                id='invite'
                                name={intl.formatMessage({id: 'Sidebar.invite-users', defaultMessage: 'Invite users'})}
                                onClick={async () => {
                                    setShowRegistrationLinkDialog(true)
                                }}
                            />

                            <Menu.Separator/>
                        </>}

                        <Menu.Text
                            id='about'
                            name={intl.formatMessage({id: 'Sidebar.about', defaultMessage: 'About Focalboard'})}
                            onClick={async () => {
                                window.open('https://www.focalboard.com?utm_source=webapp', '_blank')

                                // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
                                if (window.openInNewBrowser) {
                                    window.openInNewBrowser('https://www.focalboard.com?utm_source=webapp')
                                }
                            }}
                        />
                    </Menu>
                </MenuWrapper>

                {showRegistrationLinkDialog &&
                    <RegistrationLink
                        onClose={() => {
                            setShowRegistrationLinkDialog(false)
                        }}
                    />
                }
            </ModalWrapper>
        </div>
    )
})

export default SidebarUserMenu
