import type { Formatters, PropertyContext } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import type { IAppWindow } from 'components/common/BoardEditor/focalboard/src/types';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { addProposalEvaluationProperties } from 'lib/focalboard/addProposalEvaluationProperties';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { isTruthy } from 'lib/utilities/types';

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

export function generateTableArray(
  board: Pick<Board, 'fields'>,
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
  const proposalEvaluationAverageProperty = visibleProperties.find(
    (visibleProperty) => visibleProperty.type === 'proposalEvaluationAverage'
  );
  const rubricEvaluationTitles: string[] = [];

  if (proposalEvaluationAverageProperty) {
    cards.forEach((card) => {
      const propertyValue = card.fields.properties[proposalEvaluationAverageProperty.id] as unknown as {
        title: string;
        value: number;
      }[];
      propertyValue.forEach((value) => {
        rubricEvaluationTitles.push(value.title);
      });
    });
  }

  const evaluationTitles = Array.from(new Set(rubricEvaluationTitles));

  // Header row
  const columns: string[] = [];
  const visiblePropertiesWithTitle = [
    titleProperty || ({ id: Constants.titleColumnId, type: 'text', name: 'Title', options: [] } as IPropertyTemplate),
    ...visibleProperties
  ];

  // Merge it with evaluation proposal properties to get the initial column values
  const visiblePropertiesExtended = addProposalEvaluationProperties({
    properties: visiblePropertiesWithTitle,
    rubricEvaluationTitles: evaluationTitles
  });

  visiblePropertiesExtended.forEach((template: IPropertyTemplate) => {
    columns.push(template.name);
  });

  rows.push(columns);

  cards.forEach((card) => {
    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      visibleProperties: visiblePropertiesWithTitle,
      evaluationTitles
    });
    rows.push(rowColumns);
  });

  return rows;
}

export function getCSVColumns({
  card,
  context,
  formatters,
  visibleProperties,
  evaluationTitles = []
}: {
  evaluationTitles?: string[];
  card: Card;
  context: PropertyContext;
  formatters: Formatters;
  visibleProperties: IPropertyTemplate<PropertyType>[];
}) {
  const visiblePropertiesExtended = addProposalEvaluationProperties({
    properties: visibleProperties,
    rubricEvaluationTitles: evaluationTitles
  });
  const columns: (string | null)[] = new Array(visiblePropertiesExtended.length).fill(null);
  const columnsRow = visiblePropertiesExtended.map((p) => p.name);
  const proposalEvaluationAverageProperty = visibleProperties.find(
    (visibleProperty) => visibleProperty.type === 'proposalEvaluationAverage' && !visibleProperty.id.startsWith('__')
  );
  const proposalEvaluationTotalProperty = visibleProperties.find(
    (visibleProperty) => visibleProperty.type === 'proposalEvaluationTotal' && !visibleProperty.id.startsWith('__')
  );
  const proposalEvaluatedByProperty = visibleProperties.find(
    (visibleProperty) => visibleProperty.type === 'proposalEvaluatedBy' && !visibleProperty.id.startsWith('__')
  );

  visiblePropertiesExtended.forEach((propertyTemplate: IPropertyTemplate, index) => {
    const propertyValue = card.fields.properties[propertyTemplate.id];
    const displayValue =
      OctoUtils.propertyDisplayValue({ block: card, context, propertyValue, propertyTemplate, formatters }) || '';
    if (propertyTemplate.id === Constants.titleColumnId) {
      columns[index] = `"${encodeText(card.title)}"`;
    } else if (propertyTemplate.type === 'number') {
      const numericValue = propertyValue ? Number(propertyValue).toString() : '';
      columns[index] = numericValue;
    } else if (
      propertyTemplate.type === 'multiSelect' ||
      propertyTemplate.type === 'person' ||
      propertyTemplate.type === 'proposalAuthor' ||
      propertyTemplate.type === 'proposalReviewer'
    ) {
      const multiSelectValue = (((displayValue as unknown) || []) as string[]).join('|');
      columns[index] = multiSelectValue;
    } else if (propertyTemplate.type === 'proposalEvaluationAverage' && proposalEvaluationAverageProperty) {
      const values =
        (card.fields.properties[proposalEvaluationAverageProperty.id] as unknown as {
          title: string;
          value: number;
        }[]) ?? [];
      values.forEach(({ title, value }) => {
        const columnIndex = columnsRow.indexOf(`${title} (Evaluation average)`);
        if (columnIndex !== -1) {
          columns[columnIndex] = value.toString();
        }
      });
    } else if (propertyTemplate.type === 'proposalEvaluationTotal' && proposalEvaluationTotalProperty) {
      const values =
        (card.fields.properties[proposalEvaluationTotalProperty.id] as unknown as {
          title: string;
          value: number;
        }[]) ?? [];
      values.forEach(({ title, value }) => {
        const columnIndex = columnsRow.indexOf(`${title} (Evaluation total)`);
        if (columnIndex !== -1) {
          columns[columnIndex] = value.toString();
        }
      });
    } else if (propertyTemplate.type === 'proposalEvaluatedBy' && proposalEvaluatedByProperty) {
      const values =
        (card.fields.properties[proposalEvaluatedByProperty.id] as unknown as {
          title: string;
          value: string[];
        }[]) ?? [];
      values.forEach(({ title, value }) => {
        const columnIndex = columnsRow.indexOf(`${title} (Evaluation reviewers)`);
        if (columnIndex !== -1) {
          columns[columnIndex] = value
            .map((reviewerId) => context?.users[reviewerId]?.username)
            .filter(isTruthy)
            .join('|');
        }
      });
    } else {
      // Export as string
      columns[index] = `"${encodeText(displayValue as string)}"`;
    }
  });
  return columns.map((column) => column || '');
}
