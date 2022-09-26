"use strict";
exports.__esModule = true;
exports.dragAndDropRearrange = void 0;
var dragAndDropRearrange = function (data) {
    var contentOrder = data.contentOrder, srcBlockX = data.srcBlockX, srcBlockY = data.srcBlockY, dstBlockX = data.dstBlockX, dstBlockY = data.dstBlockY, moveTo = data.moveTo, srcBlockId = data.srcBlockId, dstBlockId = data.dstBlockId;
    var newContentOrder = JSON.parse(JSON.stringify(contentOrder));
    var copySrcBlockX = srcBlockX;
    var copySrcBlockY = srcBlockY;
    var copyDstBlockX = dstBlockX;
    var copyDstBlockY = dstBlockY;
    // Delete the block we are moving first then move it to the correct place
    // Delete Src Block
    if (copySrcBlockY > -1) {
        newContentOrder[copySrcBlockX].splice(copySrcBlockY, 1);
        if (newContentOrder[copySrcBlockX].length === 1 && copySrcBlockX !== copyDstBlockX) {
            newContentOrder.splice(copySrcBlockX, 1, newContentOrder[copySrcBlockX][0]);
        }
    }
    else {
        newContentOrder.splice(copySrcBlockX, 1);
        if (copyDstBlockX > copySrcBlockX) {
            copyDstBlockX -= 1;
        }
    }
    if (moveTo === 'right') {
        if (copyDstBlockY > -1) {
            if (copyDstBlockX === copySrcBlockX && copyDstBlockY > copySrcBlockY && copySrcBlockY > -1) {
                copyDstBlockY -= 1;
            }
            newContentOrder[copyDstBlockX].splice(copyDstBlockY + 1, 0, srcBlockId);
        }
        else {
            newContentOrder.splice(copyDstBlockX, 1, [dstBlockId, srcBlockId]);
        }
    }
    else if (moveTo === 'left') {
        if (copyDstBlockY > -1) {
            if (copyDstBlockX === copySrcBlockX && copyDstBlockY > copySrcBlockY && copySrcBlockY > -1) {
                copyDstBlockY -= 1;
            }
            newContentOrder[copyDstBlockX].splice(copyDstBlockY, 0, srcBlockId);
        }
        else {
            newContentOrder.splice(copyDstBlockX, 1, [srcBlockId, dstBlockId]);
        }
    }
    else if (moveTo === 'aboveRow') {
        newContentOrder.splice(copyDstBlockX, 0, srcBlockId);
    }
    else if (moveTo === 'belowRow') {
        newContentOrder.splice(copyDstBlockX + 1, 0, srcBlockId);
    }
    return newContentOrder;
};
exports.dragAndDropRearrange = dragAndDropRearrange;
