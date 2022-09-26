"use strict";
exports.__esModule = true;
exports.CardFilter = void 0;
var filterGroup_1 = require("./blocks/filterGroup");
var utils_1 = require("./utils");
var CardFilter = /** @class */ (function () {
    function CardFilter() {
    }
    CardFilter.applyFilterGroup = function (filterGroup, templates, cards) {
        var _this = this;
        return cards.filter(function (card) { return _this.isFilterGroupMet(filterGroup, templates, card); });
    };
    CardFilter.isFilterGroupMet = function (filterGroup, templates, card) {
        var filters = filterGroup.filters;
        if (filterGroup.filters.length < 1) {
            return true; // No filters = always met
        }
        if (filterGroup.operation === 'or') {
            for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                var filter = filters_1[_i];
                if ((0, filterGroup_1.isAFilterGroupInstance)(filter)) {
                    if (this.isFilterGroupMet(filter, templates, card)) {
                        return true;
                    }
                }
                else if (this.isClauseMet(filter, templates, card)) {
                    return true;
                }
            }
            return false;
        }
        utils_1.Utils.assert(filterGroup.operation === 'and');
        for (var _a = 0, filters_2 = filters; _a < filters_2.length; _a++) {
            var filter = filters_2[_a];
            if ((0, filterGroup_1.isAFilterGroupInstance)(filter)) {
                if (!this.isFilterGroupMet(filter, templates, card)) {
                    return false;
                }
            }
            else if (!this.isClauseMet(filter, templates, card)) {
                return false;
            }
        }
        return true;
    };
    CardFilter.isClauseMet = function (filter, templates, card) {
        var _a, _b;
        var value = card.fields.properties[filter.propertyId];
        switch (filter.condition) {
            case 'includes': {
                if (((_a = filter.values) === null || _a === void 0 ? void 0 : _a.length) < 1) {
                    break;
                } // No values = ignore clause (always met)
                return (filter.values.find(function (cValue) { return (Array.isArray(value) ? value.includes(cValue) : cValue === value); }) !== undefined);
            }
            case 'notIncludes': {
                if (((_b = filter.values) === null || _b === void 0 ? void 0 : _b.length) < 1) {
                    break;
                } // No values = ignore clause (always met)
                return (filter.values.find(function (cValue) { return (Array.isArray(value) ? value.includes(cValue) : cValue === value); }) === undefined);
            }
            case 'isEmpty': {
                return (value || '').length <= 0;
            }
            case 'isNotEmpty': {
                return (value || '').length > 0;
            }
            default: {
                utils_1.Utils.assertFailure("Invalid filter condition ".concat(filter.condition));
            }
        }
        return true;
    };
    CardFilter.propertiesThatMeetFilterGroup = function (filterGroup, templates) {
        var _this = this;
        // TODO: Handle filter groups
        if (!filterGroup) {
            return {};
        }
        var filters = filterGroup.filters.filter(function (o) { return !(0, filterGroup_1.isAFilterGroupInstance)(o); });
        if (filters.length < 1) {
            return {};
        }
        if (filterGroup.operation === 'or') {
            // Just need to meet the first clause
            var property = this.propertyThatMeetsFilterClause(filters[0], templates);
            var result_1 = {};
            if (property.value) {
                result_1[property.id] = property.value;
            }
            return result_1;
        }
        // And: Need to meet all clauses
        var result = {};
        filters.forEach(function (filterClause) {
            var property = _this.propertyThatMeetsFilterClause(filterClause, templates);
            if (property.value) {
                result[property.id] = property.value;
            }
        });
        return result;
    };
    CardFilter.propertyThatMeetsFilterClause = function (filterClause, templates) {
        var template = templates.find(function (o) { return o.id === filterClause.propertyId; });
        if (!template) {
            utils_1.Utils.assertFailure("propertyThatMeetsFilterClause. Cannot find template: ".concat(filterClause.propertyId));
            return { id: filterClause.propertyId };
        }
        switch (filterClause.condition) {
            case 'includes': {
                if (filterClause.values.length < 1) {
                    return { id: filterClause.propertyId };
                }
                return { id: filterClause.propertyId, value: filterClause.values[0] };
            }
            case 'notIncludes': {
                return { id: filterClause.propertyId };
            }
            case 'isEmpty': {
                return { id: filterClause.propertyId };
            }
            case 'isNotEmpty': {
                if (template.type === 'select') {
                    if (template.options.length > 0) {
                        var option = template.options[0];
                        return { id: filterClause.propertyId, value: option.id };
                    }
                    return { id: filterClause.propertyId };
                }
                // TODO: Handle non-select types
                return { id: filterClause.propertyId };
            }
            default: {
                utils_1.Utils.assertFailure("Unexpected filter condition: ".concat(filterClause.condition));
                return { id: filterClause.propertyId };
            }
        }
    };
    return CardFilter;
}());
exports.CardFilter = CardFilter;
