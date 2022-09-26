"use strict";
exports.__esModule = true;
exports.BlockIcons = void 0;
var emojiList_1 = require("./emojiList");
var BlockIcons = /** @class */ (function () {
    function BlockIcons() {
    }
    BlockIcons.prototype.randomIcon = function () {
        var index = Math.floor(Math.random() * emojiList_1.randomEmojiList.length);
        var icon = emojiList_1.randomEmojiList[index];
        return icon;
    };
    BlockIcons.shared = new BlockIcons();
    return BlockIcons;
}());
exports.BlockIcons = BlockIcons;
