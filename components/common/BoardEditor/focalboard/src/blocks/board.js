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
exports.createBoard = void 0;
var utils_1 = require("../utils");
var block_1 = require("./block");
function createBoard(_a) {
    var _b;
    var _c = _a === void 0 ? {} : _a, block = _c.block, addDefaultProperty = _c.addDefaultProperty;
    addDefaultProperty = addDefaultProperty !== null && addDefaultProperty !== void 0 ? addDefaultProperty : false;
    var cardProperties = (_b = block === null || block === void 0 ? void 0 : block.fields.cardProperties.map(function (o) {
        return {
            id: o.id,
            name: o.name,
            type: o.type,
            options: o.options ? o.options.map(function (option) { return (__assign({}, option)); }) : []
        };
    })) !== null && _b !== void 0 ? _b : [];
    var selectProperties = cardProperties.find(function (o) { return o.type === 'select'; });
    if (!selectProperties && addDefaultProperty) {
        var property = {
            id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
            name: 'Status',
            type: 'select',
            options: [{
                    color: 'propColorTeal',
                    id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
                    value: 'Completed'
                }, {
                    color: 'propColorYellow',
                    id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
                    value: 'In progress'
                }, {
                    color: 'propColorRed',
                    id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
                    value: 'Not started'
                }]
        };
        cardProperties.push(property);
    }
    return __assign(__assign({}, (0, block_1.createBlock)(block)), { type: 'board', fields: {
            showDescription: (block === null || block === void 0 ? void 0 : block.fields.showDescription) || false,
            description: (block === null || block === void 0 ? void 0 : block.fields.description) || '',
            icon: (block === null || block === void 0 ? void 0 : block.fields.icon) || '',
            isTemplate: (block === null || block === void 0 ? void 0 : block.fields.isTemplate) || false,
            columnCalculations: (block === null || block === void 0 ? void 0 : block.fields.columnCalculations) || [],
            headerImage: (block === null || block === void 0 ? void 0 : block.fields.headerImage) || null,
            cardProperties: cardProperties
        } });
}
exports.createBoard = createBoard;
