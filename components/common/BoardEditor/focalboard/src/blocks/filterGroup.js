"use strict";
exports.__esModule = true;
exports.isAFilterGroupInstance = exports.createFilterGroup = void 0;
var filterClause_1 = require("./filterClause");
function isAFilterGroupInstance(object) {
    return 'operation' in object && 'filters' in object;
}
exports.isAFilterGroupInstance = isAFilterGroupInstance;
function createFilterGroup(o) {
    var filters = [];
    if (o === null || o === void 0 ? void 0 : o.filters) {
        filters = o.filters.map(function (p) {
            if (isAFilterGroupInstance(p)) {
                return createFilterGroup(p);
            }
            return (0, filterClause_1.createFilterClause)(p);
        });
    }
    return {
        operation: (o === null || o === void 0 ? void 0 : o.operation) || 'and',
        filters: filters
    };
}
exports.createFilterGroup = createFilterGroup;
