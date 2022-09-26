"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.createBoardView = exports.sortBoardViewsAlphabetically = void 0;
var block_1 = require("./block");
var filterGroup_1 = require("./filterGroup");
function createBoardView(block) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __assign(__assign({}, (0, block_1.createBlock)(block)), { type: 'view', fields: {
            viewType: (block === null || block === void 0 ? void 0 : block.fields.viewType) || 'board',
            groupById: block === null || block === void 0 ? void 0 : block.fields.groupById,
            dateDisplayPropertyId: block === null || block === void 0 ? void 0 : block.fields.dateDisplayPropertyId,
            sortOptions: ((_a = block === null || block === void 0 ? void 0 : block.fields.sortOptions) === null || _a === void 0 ? void 0 : _a.map(function (o) { return (__assign({}, o)); })) || [],
            visiblePropertyIds: ((_b = block === null || block === void 0 ? void 0 : block.fields.visiblePropertyIds) === null || _b === void 0 ? void 0 : _b.slice()) || [],
            visibleOptionIds: ((_c = block === null || block === void 0 ? void 0 : block.fields.visibleOptionIds) === null || _c === void 0 ? void 0 : _c.slice()) || [],
            hiddenOptionIds: ((_d = block === null || block === void 0 ? void 0 : block.fields.hiddenOptionIds) === null || _d === void 0 ? void 0 : _d.slice()) || [],
            collapsedOptionIds: ((_e = block === null || block === void 0 ? void 0 : block.fields.collapsedOptionIds) === null || _e === void 0 ? void 0 : _e.slice()) || [],
            filter: (0, filterGroup_1.createFilterGroup)(block === null || block === void 0 ? void 0 : block.fields.filter),
            cardOrder: ((_f = block === null || block === void 0 ? void 0 : block.fields.cardOrder) === null || _f === void 0 ? void 0 : _f.slice()) || [],
            columnWidths: __assign({}, ((block === null || block === void 0 ? void 0 : block.fields.columnWidths) || {})),
            columnCalculations: __assign({}, (block === null || block === void 0 ? void 0 : block.fields.columnCalculations) || {}),
            kanbanCalculations: __assign({}, (block === null || block === void 0 ? void 0 : block.fields.kanbanCalculations) || {}),
            defaultTemplateId: (block === null || block === void 0 ? void 0 : block.fields.defaultTemplateId) || '',
            linkedSourceId: (_g = block === null || block === void 0 ? void 0 : block.fields.linkedSourceId) !== null && _g !== void 0 ? _g : null
        } });
}
exports.createBoardView = createBoardView;
function sortBoardViewsAlphabetically(views) {
    // Strip leading emoji to prevent unintuitive results
    return views.map(function (v) {
        return { view: v, title: v.title.replace(/^\p{Emoji}*\s*/u, '') };
    }).sort(function (v1, v2) { return v1.title.localeCompare(v2.title); }).map(function (v) { return v.view; });
}
exports.sortBoardViewsAlphabetically = sortBoardViewsAlphabetically;
