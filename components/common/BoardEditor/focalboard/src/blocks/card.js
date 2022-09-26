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
exports.createCard = void 0;
var block_1 = require("./block");
/**
 * Returns a focalboard-ready card data stub
 */
function createCard(block) {
    var _a, _b, _c, _d, _e, _f;
    var contentOrder = [];
    var contentIds = (_b = (_a = block === null || block === void 0 ? void 0 : block.fields) === null || _a === void 0 ? void 0 : _a.contentOrder) === null || _b === void 0 ? void 0 : _b.filter(function (id) { return id !== null; });
    if ((contentIds === null || contentIds === void 0 ? void 0 : contentIds.length) > 0) {
        for (var _i = 0, contentIds_1 = contentIds; _i < contentIds_1.length; _i++) {
            var contentId = contentIds_1[_i];
            if (typeof contentId === 'string') {
                contentOrder.push(contentId);
            }
            else {
                contentOrder.push(contentId.slice());
            }
        }
    }
    return __assign(__assign({}, (0, block_1.createBlock)(block)), { type: 'card', fields: {
            icon: ((_c = block === null || block === void 0 ? void 0 : block.fields) === null || _c === void 0 ? void 0 : _c.icon) || '',
            properties: __assign({}, (((_d = block === null || block === void 0 ? void 0 : block.fields) === null || _d === void 0 ? void 0 : _d.properties) || {})),
            contentOrder: contentOrder,
            isTemplate: ((_e = block === null || block === void 0 ? void 0 : block.fields) === null || _e === void 0 ? void 0 : _e.isTemplate) || false,
            headerImage: ((_f = block === null || block === void 0 ? void 0 : block.fields) === null || _f === void 0 ? void 0 : _f.headerImage) || null
        } });
}
exports.createCard = createCard;
