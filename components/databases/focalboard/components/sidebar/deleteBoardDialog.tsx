// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'

import Dialog from '../dialog'
import RootPortal from '../rootPortal'

import './deleteBoardDialog.scss'

type Props = {
    boardTitle: string;
    onClose: () => void;
    onDelete: () => Promise<void>
}

export default function DeleteBoardDialog(props: Props): JSX.Element {
    const [isSubmitting, setSubmitting] = useState(false)

    return (
        <RootPortal>
            <Dialog
                onClose={props.onClose}
                toolsMenu={null}
                className='DeleteBoardDialog'
            >
                <div className='container'>
                    <h2 className='header text-heading5'>
                        <FormattedMessage
                            id='DeleteBoardDialog.confirm-tite'
                            defaultMessage='Confirm Delete Board'
                        />
                    </h2>
                    <p className='body'>
                        <FormattedMessage
                            id='DeleteBoardDialog.confirm-info'
                            defaultMessage='Are you sure you want to delete the board “{boardTitle}”? Deleting it will delete all cards in the board.'
                            values={{
                                boardTitle: props.boardTitle,
                            }}
                        />
                    </p>
                    <div className='footer'>
                        <Button
                            size={'medium'}
                            emphasis={'tertiary'}
                            onClick={() => !isSubmitting && props.onClose()}
                        >
                            <FormattedMessage
                                id='DeleteBoardDialog.confirm-cancel'
                                defaultMessage='Cancel'
                            />
                        </Button>
                        <Button
                            size={'medium'}
                            filled={true}
                            danger={true}
                            onClick={async () => {
                                try {
                                    setSubmitting(true)
                                    await props.onDelete()
                                    setSubmitting(false)
                                    props.onClose()
                                } catch (e) {
                                    setSubmitting(false)
                                    Utils.logError(`Delete board ERROR: ${e}`)

                                    // TODO: display error on screen
                                }
                            }}
                        >
                            <FormattedMessage
                                id='DeleteBoardDialog.confirm-delete'
                                defaultMessage='Delete'
                            />
                        </Button>
                    </div>
                </div>
            </Dialog>
        </RootPortal>
    )
}
