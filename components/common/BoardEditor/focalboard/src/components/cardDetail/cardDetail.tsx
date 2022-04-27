// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DocumentPage from 'components/[pageId]/DocumentPage'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Card } from '../../blocks/card'
import mutator from '../../mutator'
import { Focusable } from '../../widgets/editable'
import useImagePaste from './imagePaste'
import { usePages } from 'hooks/usePages'
import log from 'lib/log'
import { Prisma, Page } from '@prisma/client';
import charmClient from 'charmClient';
import debouncePromise from 'lib/utilities/debouncePromise';

type Props = {
    card: Card
    readonly: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card, readonly} = props

    const [title, setTitle] = useState(card.title)
    const [serverTitle, setServerTitle] = useState(card.title)
    const titleRef = useRef<Focusable>(null)
    const saveTitle = useCallback(() => {
        if (title !== card.title) {
            mutator.changeTitle(card.id, card.title, title)
        }
    }, [card.title, title])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle

    useImagePaste(card.id, card.fields.contentOrder, card.rootId)

    useEffect(() => {
        if (!title) {
            titleRef.current?.focus()
        }
    }, [])

    useEffect(() => {
        if (serverTitle === title) {
            setTitle(card.title)
        }
        setServerTitle(card.title)
    }, [card.title, title])

    useEffect(() => {
        return () => {
            saveTitleRef.current && saveTitleRef.current()
        }
    }, [])

    const { pages, setPages } = usePages();

    const debouncedPageUpdate = debouncePromise((updates: Prisma.PageUpdateInput) => {
        setPages((_pages) => ({
          ..._pages,
          [card.id]: {
            ..._pages[card.id]!,
            ...updates as Partial<Page>
          }
        }));
        return charmClient.updatePage(updates);
    }, 500);

    const setPage = useCallback(async (updates: Partial<Page>) => {
      debouncedPageUpdate({ id: card.id, ...updates } as Prisma.PageUpdateInput)
        .catch((err: any) => {
          log.error('Error saving page', err);
        });
    }, [card]);

    const page = pages[card?.id];
    if (!card || !page) {
      return null
    }
    return (
      <DocumentPage page={page} setPage={setPage} readOnly={readonly} />
    )
}

export default CardDetail
