import type { Formatters, PropertyContext } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import type { IAppWindow } from 'components/common/BoardEditor/focalboard/src/types';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';

declare let window: IAppWindow;

export const CsvExporter = {
  exportTableCsv(
    board: Board,
    view: BoardView,
    cards: Card[],
    formatters: Formatters,
    context: PropertyContext
  ): string {
    const { csvContent, filename } = this.generateCSV(board, view, cards, formatters, context);

    const csvData = `data:text/csv;charset=utf-8,${csvContent}`;

    const link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('href', csvData);
    link.setAttribute('download', filename);
    document.body.appendChild(link); // FireFox support

    link.click();

    // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
    if (window.openInNewBrowser) {
      window.openInNewBrowser(csvContent);
    }

    return csvContent;
  },
  generateCSV(board: Board, view: BoardView, cards: Card[], formatters: Formatters, context: PropertyContext) {
    const rows = generateTableArray(board, cards, view, formatters, context);
    let csvContent = '';

    rows.forEach((row) => {
      const encodedRow = row.join(',');
      csvContent += encodeURIComponent(`${encodedRow}\r\n`);
    });

    let fileTitle = view.title;
    if (view.fields.sourceType === 'google_form') {
      fileTitle = `Responses to ${view.fields.sourceData?.formName}`;
    }

    const filename = `${Utils.sanitizeFilename(fileTitle || 'CharmVerse Table Export')}.csv`;

    return {
      filename,
      csvContent
    };
  }
};

function encodeText(text: string): string {
  return text.replace(/"/g, '""');
}

function generateTableArray(
  board: Board,
  cards: Card[],
  viewToExport: BoardView,
  formatters: Formatters,
  context: PropertyContext
): string[][] {
  const rows: string[][] = [];
  const visibleProperties = board.fields.cardProperties.filter(
    (template: IPropertyTemplate) =>
      template.id === Constants.titleColumnId || viewToExport.fields.visiblePropertyIds.includes(template.id)
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

  const titleProperty = visibleProperties.find((visibleProperty) => visibleProperty.id === Constants.titleColumnId);
  // Header row
  const row: string[] = titleProperty ? [] : ['Title'];
  visibleProperties.forEach((template: IPropertyTemplate) => {
    row.push(template.name);
  });
  rows.push(row);

  cards.forEach((card) => {
    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      hasTitleProperty: !!titleProperty,
      visibleProperties
    });
    rows.push(rowColumns);
  });

  return rows;
}

export function getCSVColumns({
  card,
  context,
  formatters,
  hasTitleProperty,
  visibleProperties
}: {
  card: Card;
  context: PropertyContext;
  formatters: Formatters;
  hasTitleProperty: boolean;
  visibleProperties: IPropertyTemplate<PropertyType>[];
}) {
  const columns: string[] = [];
  if (!hasTitleProperty) {
    columns.push(`"${encodeText(card.title)}"`);
  }
  visibleProperties.forEach((propertyTemplate: IPropertyTemplate) => {
    const propertyValue = card.fields.properties[propertyTemplate.id];
    const displayValue =
      OctoUtils.propertyDisplayValue({ block: card, context, propertyValue, propertyTemplate, formatters }) || '';

    if (propertyTemplate.id === Constants.titleColumnId) {
      columns.push(`"${encodeText(card.title)}"`);
    } else if (
      propertyTemplate.type === 'number' ||
      propertyTemplate.type === 'proposalEvaluationAverage' ||
      propertyTemplate.type === 'proposalEvaluationTotal'
    ) {
      const numericValue = propertyValue ? Number(propertyValue).toString() : '';
      columns.push(numericValue);
    } else if (
      propertyTemplate.type === 'multiSelect' ||
      propertyTemplate.type === 'person' ||
      propertyTemplate.type === 'proposalEvaluatedBy' ||
      propertyTemplate.type === 'proposalAuthor' ||
      propertyTemplate.type === 'proposalReviewer'
    ) {
      const multiSelectValue = (((displayValue as unknown) || []) as string[]).join('|');
      columns.push(multiSelectValue);
    } else {
      // Export as string
      columns.push(`"${encodeText(displayValue as string)}"`);
    }
  });
  return columns;
}
