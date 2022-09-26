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
exports.createDividerBlock = void 0;
var block_1 = require("./block");
function createDividerBlock(block) {
    return __assign(__assign({}, (0, block_1.createBlock)(block)), { type: 'divider' });
}
exports.createDividerBlock = createDividerBlock;
