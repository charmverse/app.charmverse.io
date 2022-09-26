"use strict";
exports.__esModule = true;
exports.TestBlockFactory = void 0;
var board_1 = require("../blocks/board");
var boardView_1 = require("../blocks/boardView");
var card_1 = require("../blocks/card");
var commentBlock_1 = require("../blocks/commentBlock");
var dividerBlock_1 = require("../blocks/dividerBlock");
var filterClause_1 = require("../blocks/filterClause");
var filterGroup_1 = require("../blocks/filterGroup");
var imageBlock_1 = require("../blocks/imageBlock");
var textBlock_1 = require("../blocks/textBlock");
var checkboxBlock_1 = require("../blocks/checkboxBlock");
var TestBlockFactory = /** @class */ (function () {
    function TestBlockFactory() {
    }
    TestBlockFactory.createBoard = function () {
        var board = (0, board_1.createBoard)();
        board.rootId = board.id;
        board.title = 'board title';
        board.fields.description = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: []
                }
            ]
        };
        board.fields.showDescription = true;
        board.fields.icon = 'i';
        for (var i = 0; i < 3; i++) {
            var propertyOption = {
                id: 'value1',
                value: 'value 1',
                color: 'propColorTurquoise'
            };
            var propertyTemplate = {
                id: "property".concat(i + 1),
                name: "Property ".concat(i + 1),
                type: 'select',
                options: [propertyOption]
            };
            board.fields.cardProperties.push(propertyTemplate);
        }
        return board;
    };
    TestBlockFactory.createBoardView = function (board) {
        var view = (0, boardView_1.createBoardView)();
        view.parentId = board ? board.id : 'parent';
        view.rootId = board ? board.rootId : 'root';
        view.title = 'view title';
        view.fields.viewType = 'board';
        view.fields.groupById = 'property1';
        view.fields.hiddenOptionIds = ['value1'];
        view.fields.cardOrder = ['card1', 'card2', 'card3'];
        view.fields.sortOptions = [
            {
                propertyId: 'property1',
                reversed: true
            },
            {
                propertyId: 'property2',
                reversed: false
            }
        ];
        view.fields.columnWidths = {
            column1: 100,
            column2: 200
        };
        // Filter
        var filterGroup = (0, filterGroup_1.createFilterGroup)();
        var filter = (0, filterClause_1.createFilterClause)();
        filter.propertyId = 'property1';
        filter.condition = 'includes';
        filter.values = ['value1'];
        filterGroup.filters.push(filter);
        view.fields.filter = filterGroup;
        return view;
    };
    TestBlockFactory.createTableView = function (board) {
        var view = (0, boardView_1.createBoardView)();
        view.parentId = board ? board.id : 'parent';
        view.rootId = board ? board.rootId : 'root';
        view.title = 'view title';
        view.fields.viewType = 'table';
        view.fields.groupById = 'property1';
        view.fields.hiddenOptionIds = ['value1'];
        view.fields.cardOrder = ['card1', 'card2', 'card3'];
        view.fields.sortOptions = [
            {
                propertyId: 'property1',
                reversed: true
            },
            {
                propertyId: 'property2',
                reversed: false
            }
        ];
        view.fields.columnWidths = {
            column1: 100,
            column2: 200
        };
        // Filter
        var filterGroup = (0, filterGroup_1.createFilterGroup)();
        var filter = (0, filterClause_1.createFilterClause)();
        filter.propertyId = 'property1';
        filter.condition = 'includes';
        filter.values = ['value1'];
        filterGroup.filters.push(filter);
        view.fields.filter = filterGroup;
        return view;
    };
    TestBlockFactory.createCard = function (board) {
        var card = (0, card_1.createCard)();
        card.parentId = board ? board.id : 'parent';
        card.rootId = board ? board.rootId : 'root';
        card.title = 'title';
        card.fields.icon = 'i';
        card.fields.properties.property1 = 'value1';
        return card;
    };
    TestBlockFactory.addToCard = function (block, card, isContent) {
        if (isContent === void 0) { isContent = true; }
        block.parentId = card.id;
        block.rootId = card.rootId;
        if (isContent) {
            card.fields.contentOrder.push(block.id);
        }
        return block;
    };
    TestBlockFactory.createComment = function (card) {
        var block = this.addToCard((0, commentBlock_1.createCommentBlock)(), card, false);
        block.title = 'title';
        return block;
    };
    TestBlockFactory.createText = function (card) {
        var block = this.addToCard((0, textBlock_1.createTextBlock)(), card);
        block.title = 'title';
        return block;
    };
    TestBlockFactory.createImage = function (card) {
        var block = this.addToCard((0, imageBlock_1.createImageBlock)(), card);
        block.fields.fileId = 'fileId';
        return block;
    };
    TestBlockFactory.createDivider = function (card) {
        var block = this.addToCard((0, dividerBlock_1.createDividerBlock)(), card);
        block.title = 'title';
        return block;
    };
    TestBlockFactory.createCheckbox = function (card) {
        var block = this.addToCard((0, checkboxBlock_1.createCheckboxBlock)(), card);
        block.title = 'title';
        return block;
    };
    return TestBlockFactory;
}());
exports.TestBlockFactory = TestBlockFactory;
