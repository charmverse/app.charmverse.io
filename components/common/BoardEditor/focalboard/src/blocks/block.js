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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.createPatchesFromBlocks = exports.createBlock = exports.contentBlockTypes = exports.blockTypes = void 0;
var difference_1 = require("lodash/difference");
var utils_1 = require("../utils");
var contentBlockTypes = ['text', 'image', 'divider', 'checkbox'];
exports.contentBlockTypes = contentBlockTypes;
var blockTypes = __spreadArray(__spreadArray([], contentBlockTypes, true), ['board', 'view', 'card', 'comment', 'unknown'], false);
exports.blockTypes = blockTypes;
function createBlock(block) {
    var now = Date.now();
    return {
        id: (block === null || block === void 0 ? void 0 : block.id) || utils_1.Utils.createGuid(utils_1.Utils.blockTypeToIDType(block === null || block === void 0 ? void 0 : block.type)),
        schema: 1,
        spaceId: (block === null || block === void 0 ? void 0 : block.spaceId) || '',
        parentId: (block === null || block === void 0 ? void 0 : block.parentId) || '',
        rootId: (block === null || block === void 0 ? void 0 : block.rootId) || '',
        createdBy: (block === null || block === void 0 ? void 0 : block.createdBy) || '',
        updatedBy: (block === null || block === void 0 ? void 0 : block.updatedBy) || '',
        type: (block === null || block === void 0 ? void 0 : block.type) || 'unknown',
        fields: (block === null || block === void 0 ? void 0 : block.fields) ? __assign({}, block === null || block === void 0 ? void 0 : block.fields) : {},
        title: (block === null || block === void 0 ? void 0 : block.title) || '',
        createdAt: (block === null || block === void 0 ? void 0 : block.createdAt) || now,
        updatedAt: (block === null || block === void 0 ? void 0 : block.updatedAt) || now,
        deletedAt: (block === null || block === void 0 ? void 0 : block.deletedAt) || null
    };
}
exports.createBlock = createBlock;
// createPatchesFromBlock creates two BlockPatch instances, one that
// contains the delta to update the block and another one for the undo
// action, in case it happens
function createPatchesFromBlocks(newBlock, oldBlock) {
    var newDeletedFields = (0, difference_1["default"])(Object.keys(newBlock.fields), Object.keys(oldBlock.fields));
    var newUpdatedFields = {};
    var newUpdatedData = {};
    Object.keys(newBlock.fields).forEach(function (val) {
        if (oldBlock.fields[val] !== newBlock.fields[val]) {
            newUpdatedFields[val] = newBlock.fields[val];
        }
    });
    Object.keys(newBlock).forEach(function (val) {
        if (val !== 'fields' && oldBlock[val] !== newBlock[val]) {
            newUpdatedData[val] = newBlock[val];
        }
    });
    var oldDeletedFields = (0, difference_1["default"])(Object.keys(oldBlock.fields), Object.keys(newBlock.fields));
    var oldUpdatedFields = {};
    var oldUpdatedData = {};
    Object.keys(oldBlock.fields).forEach(function (val) {
        if (oldBlock.fields[val] !== newBlock.fields[val]) {
            oldUpdatedFields[val] = oldBlock.fields[val];
        }
    });
    Object.keys(oldBlock).forEach(function (val) {
        if (val !== 'fields' && oldBlock[val] !== newBlock[val]) {
            oldUpdatedData[val] = oldBlock[val];
        }
    });
    return [
        __assign(__assign({}, newUpdatedData), { updatedFields: newUpdatedFields, deletedFields: oldDeletedFields }),
        __assign(__assign({}, oldUpdatedData), { updatedFields: oldUpdatedFields, deletedFields: newDeletedFields })
    ];
}
exports.createPatchesFromBlocks = createPatchesFromBlocks;
