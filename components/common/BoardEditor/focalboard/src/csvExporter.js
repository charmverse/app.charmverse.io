"use strict";
exports.__esModule = true;
exports.CsvExporter = void 0;
var octoUtils_1 = require("./octoUtils");
var utils_1 = require("./utils");
var CsvExporter = /** @class */ (function () {
    function CsvExporter() {
    }
    CsvExporter.exportTableCsv = function (board, activeView, cards, intl, view) {
        var viewToExport = view !== null && view !== void 0 ? view : activeView;
        if (!viewToExport) {
            return;
        }
        var rows = CsvExporter.generateTableArray(board, cards, viewToExport, intl);
        var csvContent = 'data:text/csv;charset=utf-8,';
        rows.forEach(function (row) {
            var encodedRow = row.join(',');
            csvContent += "".concat(encodedRow, "\r\n");
        });
        var filename = "".concat(utils_1.Utils.sanitizeFilename(viewToExport.title || 'Untitled'), ".csv");
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link); // FireFox support
        link.click();
        // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
        if (window.openInNewBrowser) {
            window.openInNewBrowser(encodedUri);
        }
        // TODO: Remove or reuse link
    };
    CsvExporter.encodeText = function (text) {
        return text.replace(/"/g, '""');
    };
    CsvExporter.generateTableArray = function (board, cards, viewToExport, intl) {
        var _this = this;
        var rows = [];
        var visibleProperties = board.fields.cardProperties.filter(function (template) { return viewToExport.fields.visiblePropertyIds.includes(template.id); });
        if (viewToExport.fields.viewType === 'calendar'
            && viewToExport.fields.dateDisplayPropertyId
            && !viewToExport.fields.visiblePropertyIds.includes(viewToExport.fields.dateDisplayPropertyId)) {
            var dateDisplay = board.fields.cardProperties.find(function (template) { return viewToExport.fields.dateDisplayPropertyId === template.id; });
            if (dateDisplay) {
                visibleProperties.push(dateDisplay);
            }
        }
        {
            // Header row
            var row_1 = [intl.formatMessage({ id: 'TableComponent.name', defaultMessage: 'Name' })];
            visibleProperties.forEach(function (template) {
                row_1.push(template.name);
            });
            rows.push(row_1);
        }
        cards.forEach(function (card) {
            var row = [];
            row.push("\"".concat(_this.encodeText(card.title), "\""));
            visibleProperties.forEach(function (template) {
                var propertyValue = card.fields.properties[template.id];
                var displayValue = (octoUtils_1.OctoUtils.propertyDisplayValue(card, propertyValue, template, intl) || '');
                if (template.type === 'number') {
                    var numericValue = propertyValue ? Number(propertyValue).toString() : '';
                    row.push(numericValue);
                }
                else if (template.type === 'multiSelect') {
                    var multiSelectValue = (displayValue || []).join('|');
                    row.push(multiSelectValue);
                }
                else {
                    // Export as string
                    row.push("\"".concat(_this.encodeText(displayValue), "\""));
                }
            });
            rows.push(row);
        });
        return rows;
    };
    return CsvExporter;
}());
exports.CsvExporter = CsvExporter;
