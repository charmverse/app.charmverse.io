"use strict";
exports.__esModule = true;
var testBlockFactory_1 = require("../test/testBlockFactory");
var block_1 = require("./block");
describe('block tests', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    describe('correctly generate patches from two blocks', function () {
        it('should generate two empty patches for the same block', function () {
            var textBlock = testBlockFactory_1.TestBlockFactory.createText(card);
            var result = (0, block_1.createPatchesFromBlocks)(textBlock, textBlock);
            expect(result).toMatchSnapshot();
        });
        it('should add fields on the new fields added and remove it in the undo', function () {
            var oldBlock = testBlockFactory_1.TestBlockFactory.createText(card);
            var newBlock = (0, block_1.createBlock)(oldBlock);
            newBlock.fields.newField = 'new field';
            var result = (0, block_1.createPatchesFromBlocks)(newBlock, oldBlock);
            expect(result).toMatchSnapshot();
        });
        it('should remove field on the new block added and add it again in the undo', function () {
            var oldBlock = testBlockFactory_1.TestBlockFactory.createText(card);
            var newBlock = (0, block_1.createBlock)(oldBlock);
            oldBlock.fields.test = 'test';
            var result = (0, block_1.createPatchesFromBlocks)(newBlock, oldBlock);
            expect(result).toMatchSnapshot();
        });
        it('should update propertie on the main object and revert it back on the undo', function () {
            var oldBlock = testBlockFactory_1.TestBlockFactory.createText(card);
            var newBlock = (0, block_1.createBlock)(oldBlock);
            oldBlock.parentId = 'old-parent-id';
            newBlock.parentId = 'new-parent-id';
            var result = (0, block_1.createPatchesFromBlocks)(newBlock, oldBlock);
            expect(result).toMatchSnapshot();
        });
    });
});
