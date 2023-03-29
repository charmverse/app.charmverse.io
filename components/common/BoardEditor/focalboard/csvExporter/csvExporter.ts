import type { IntlShape } from 'react-intl';

import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import type { IAppWindow } from 'components/common/BoardEditor/focalboard/src/types';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

declare let window: IAppWindow;

class CsvExporter {
  static exportTableCsv(
    board: Board,
    view: BoardView,
    cards: Card[],
    formatter: {
      date: (date: Date | string) => string;
      dateTime: (date: Date | string) => string;
    }
  ): string {
    const rows = CsvExporter.generateTableArray(board, cards, view, formatter);
    let csvContent = 'data:text/csv;charset=utf-8,';

    rows.forEach((row) => {
      const encodedRow = row.join(',');
      csvContent += encodeURIComponent(`${encodedRow}\r\n`);
    });

    let fileTitle = view.title;
    if (view.fields.sourceType === 'google_form') {
      fileTitle = `Responses to ${view.fields.sourceData?.formName}`;
    }

    const filename = `${Utils.sanitizeFilename(fileTitle || 'CharmVerse Table Export')}.csv`;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link); // FireFox support

    link.click();

    // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
    if (window.openInNewBrowser) {
      window.openInNewBrowser(csvContent);
    }

    return csvContent;
  }

  private static encodeText(text: string): string {
    return text.replace(/"/g, '""');
  }

  private static generateTableArray(
    board: Board,
    cards: Card[],
    viewToExport: BoardView,
    formatter: {
      date: (date: Date | string) => string;
      dateTime: (date: Date | string) => string;
    }
  ): string[][] {
    const rows: string[][] = [];
    const visibleProperties = board.fields.cardProperties.filter((template: IPropertyTemplate) =>
      viewToExport.fields.visiblePropertyIds.includes(template.id)
    );

    if (
      viewToExport.fields.viewType === 'calendar' &&
      viewToExport.fields.dateDisplayPropertyId &&
      !viewToExport.fields.visiblePropertyIds.includes(viewToExport.fields.dateDisplayPropertyId)
    ) {
      const dateDisplay = board.fields.cardProperties.find(
        (template: IPropertyTemplate) => viewToExport.fields.dateDisplayPropertyId === template.id
      );
      if (dateDisplay) {
        visibleProperties.push(dateDisplay);
      }
    }

    // Header row
    const row: string[] = ['Title'];
    visibleProperties.forEach((template: IPropertyTemplate) => {
      row.push(template.name);
    });
    rows.push(row);

    cards.forEach((card) => {
      const _row: string[] = [];
      _row.push(`"${this.encodeText(card.title)}"`);
      visibleProperties.forEach((template: IPropertyTemplate) => {
        const propertyValue = card.fields.properties[template.id];
        const displayValue = (OctoUtils.propertyDisplayValue(card, propertyValue, template, formatter) || '') as string;

        if (template.type === 'number') {
          const numericValue = propertyValue ? Number(propertyValue).toString() : '';
          _row.push(numericValue);
        } else if (template.type === 'multiSelect' || template.type === 'person') {
          const multiSelectValue = (((displayValue as unknown) || []) as string[]).join('|');
          _row.push(multiSelectValue);
        } else {
          // Export as string
          _row.push(`"${this.encodeText(displayValue)}"`);
        }
      });
      rows.push(_row);
    });

    return rows;
  }
}

export { CsvExporter };
