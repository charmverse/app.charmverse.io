"use strict";
exports.__esModule = true;
exports.areEqual = exports.createFilterClause = void 0;
var utils_1 = require("../utils");
function createFilterClause(o) {
    var _a;
    return {
        propertyId: (o === null || o === void 0 ? void 0 : o.propertyId) || '',
        condition: (o === null || o === void 0 ? void 0 : o.condition) || 'includes',
        values: ((_a = o === null || o === void 0 ? void 0 : o.values) === null || _a === void 0 ? void 0 : _a.slice()) || []
    };
}
exports.createFilterClause = createFilterClause;
function areEqual(a, b) {
    return (a.propertyId === b.propertyId
        && a.condition === b.condition
        && utils_1.Utils.arraysEqual(a.values, b.values));
}
exports.areEqual = areEqual;
