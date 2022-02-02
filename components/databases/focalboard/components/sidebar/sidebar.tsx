// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {useIntl} from 'react-intl'

import DashboardOnboardingSvg from '../../svg/dashboard-onboarding'

import {getActiveThemeName, loadTheme} from '../../theme'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'
import {getSortedBoards} from '../../store/boards'
import {getSortedViews} from '../../store/views'
import {getCurrentWorkspace} from '../../store/workspace'
import {useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'

import './sidebar.scss'

import WorkspaceSwitcher from '../workspaceSwitcher/workspaceSwitcher'

import SidebarAddBoardMenu from './sidebarAddBoardMenu'
import SidebarBoardItem from './sidebarBoardItem'
import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarUserMenu from './sidebarUserMenu'

type Props = {
    activeBoardId?: string
    activeViewId?: string
    isDashboard?: boolean
}

function getWindowDimensions() {
    const {innerWidth: width, innerHeight: height} = window
    return {
        width,
        height,
    }
}

const Sidebar = React.memo((props: Props) => {
    const [isHidden, setHidden] = useState(false)
    const [userHidden, setUserHidden] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())
    const boards = useAppSelector(getSortedBoards)
    const views = useAppSelector(getSortedViews)
    const intl = useIntl()

    useEffect(() => {
        loadTheme()
    }, [])

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        hideSidebar()
    }, [windowDimensions])

    const workspace = useAppSelector(getCurrentWorkspace)
    if (!boards) {
        return <div/>
    }

    const hideSidebar = () => {
        if (!userHidden) {
            if (windowDimensions.width < 768) {
                setHidden(true)
            } else {
                setHidden(false)
            }
        }
    }

    if (isHidden) {
        return (
            <div className='Sidebar octo-sidebar hidden'>
                <div className='octo-sidebar-header show-button'>
                    <div className='hamburger-icon'>
                        <IconButton
                            icon={<HamburgerIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                    <div className='show-icon'>
                        <IconButton
                            icon={<ShowSidebarIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='Sidebar octo-sidebar'>
            {!Utils.isFocalboardPlugin() &&
                <div className='octo-sidebar-header'>
                    <div className='heading'>
                        <SidebarUserMenu/>
                    </div>

                    <div className='octo-spacer'/>
                    <div className='sidebarSwitcher'>
                        <IconButton
                            onClick={() => {
                                setUserHidden(true)
                                setHidden(true)
                            }}
                            icon={<HideSidebarIcon/>}
                        />
                    </div>
                </div>}

            {workspace && workspace.id !== '0' &&
                <div className='WorkspaceTitle'>
                    {Utils.isFocalboardPlugin() &&
                    <>
                        <div className='octo-spacer'/>
                        <div className='sidebarSwitcher'>
                            <IconButton
                                onClick={() => {
                                    setUserHidden(true)
                                    setHidden(true)
                                }}
                                icon={<HideSidebarIcon/>}
                            />
                        </div>
                    </>
                    }
                </div>
            }

            {
                workspace && workspace.id !== '0' && !props.isDashboard &&
                <WorkspaceSwitcher activeWorkspace={workspace}/>
            }

            {
                props.isDashboard &&
                (
                    <React.Fragment>
                        <WorkspaceSwitcher/>
                        <div className='Sidebar__onboarding'>
                            <DashboardOnboardingSvg/>
                            <div>
                                {intl.formatMessage({id: 'DashboardPage.CenterPanel.ChangeChannels', defaultMessage: 'Use the switcher to easily change channels'})}
                            </div>
                        </div>
                    </React.Fragment>
                )
            }

            {
                !props.isDashboard &&
                <div className='octo-sidebar-list'>
                    {
                        boards.map((board) => {
                            const nextBoardId = boards.length > 1 ? boards.find((o) => o.id !== board.id)?.id : undefined
                            return (
                                <SidebarBoardItem
                                    hideSidebar={hideSidebar}
                                    key={board.id}
                                    views={views}
                                    board={board}
                                    activeBoardId={props.activeBoardId}
                                    activeViewId={props.activeViewId}
                                    nextBoardId={board.id === props.activeBoardId ? nextBoardId : undefined}
                                />
                            )
                        })
                    }
                </div>
            }

            <div className='octo-spacer'/>

            {
                (!props.isDashboard && !Utils.isFocalboardPlugin()) &&
                <SidebarAddBoardMenu
                    activeBoardId={props.activeBoardId}
                />
            }

            {!Utils.isFocalboardPlugin() &&
                <SidebarSettingsMenu activeTheme={getActiveThemeName()}/>}
        </div>
    )
})

export default Sidebar
