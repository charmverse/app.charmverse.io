// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {BoardView} from './blocks/boardView'
import {Board, IPropertyTemplate} from './blocks/board'
import {Card} from './blocks/card'
import {OctoUtils} from './octoUtils'
import {Utils} from './utils'
import {IAppWindow} from './types'

declare let window: IAppWindow

class CsvExporter {
    static exportTableCsv(board: Board, activeView: BoardView, cards: Card[], intl: IntlShape, view?: BoardView): void {
        const viewToExport = view ?? activeView

        if (!viewToExport) {
            return
        }

        const rows = CsvExporter.generateTableArray(board, cards, viewToExport, intl)

        let csvContent = 'data:text/csv;charset=utf-8,'

        rows.forEach((row) => {
            const encodedRow = row.join(',')
            csvContent += encodedRow + '\r\n'
        })

        const filename = `${Utils.sanitizeFilename(viewToExport.title || 'Untitled')}.csv`
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.style.display = 'none'
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', filename)
        document.body.appendChild(link)						// FireFox support

        link.click()

        // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
        if (window.openInNewBrowser) {
            window.openInNewBrowser(encodedUri)
        }

        // TODO: Remove or reuse link
    }

    private static encodeText(text: string): string {
        return text.replace(/"/g, '""')
    }

    private static generateTableArray(board: Board, cards: Card[], viewToExport: BoardView, intl: IntlShape): string[][] {
        const rows: string[][] = []
        const visibleProperties = board.fields.cardProperties.filter((template: IPropertyTemplate) => viewToExport.fields.visiblePropertyIds.includes(template.id))

        if (viewToExport.fields.viewType === 'calendar' &&
            viewToExport.fields.dateDisplayPropertyId &&
            !viewToExport.fields.visiblePropertyIds.includes(viewToExport.fields.dateDisplayPropertyId)) {
            const dateDisplay = board.fields.cardProperties.find((template: IPropertyTemplate) => viewToExport.fields.dateDisplayPropertyId === template.id)
            if (dateDisplay) {
                visibleProperties.push(dateDisplay)
            }
        }

        {
            // Header row
            const row: string[] = [intl.formatMessage({id: 'TableComponent.name', defaultMessage: 'Name'})]
            visibleProperties.forEach((template: IPropertyTemplate) => {
                row.push(template.name)
            })
            rows.push(row)
        }

        cards.forEach((card) => {
            const row: string[] = []
            row.push(`"${this.encodeText(card.title)}"`)
            visibleProperties.forEach((template: IPropertyTemplate) => {
                const propertyValue = card.fields.properties[template.id]
                const displayValue = (OctoUtils.propertyDisplayValue(card, propertyValue, template, intl) || '') as string
                if (template.type === 'number') {
                    const numericValue = propertyValue ? Number(propertyValue).toString() : ''
                    row.push(numericValue)
                } else if (template.type === 'multiSelect') {
                    const multiSelectValue = ((displayValue as unknown || []) as string[]).join('|')
                    row.push(multiSelectValue)
                } else {
                    // Export as string
                    row.push(`"${this.encodeText(displayValue)}"`)
                }
            })
            rows.push(row)
        })

        return rows
    }
}

export {CsvExporter}
