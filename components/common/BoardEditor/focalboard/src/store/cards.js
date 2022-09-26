"use strict";
var _a;
exports.__esModule = true;
exports.getViewCardsSortedFilteredAndGrouped = exports.getCurrentViewCardsSortedFilteredAndGrouped = exports.getCurrentBoardTemplates = exports.getBoardCards = exports.getCurrentBoardCards = exports.getCard = exports.getSortedTemplates = exports.getTemplates = exports.getSortedCards = exports.getCards = exports.reducer = exports.setCurrent = exports.addTemplate = exports.addCard = exports.updateCards = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var cardFilter_1 = require("../cardFilter");
var constants_1 = require("../constants");
var utils_1 = require("../utils");
var boards_1 = require("./boards");
var initialLoad_1 = require("./initialLoad");
var searchText_1 = require("./searchText");
var users_1 = require("./users");
var views_1 = require("./views");
var cardsSlice = (0, toolkit_1.createSlice)({
    name: 'cards',
    initialState: {
        current: '',
        cards: {},
        templates: {}
    },
    reducers: {
        setCurrent: function (state, action) {
            state.current = action.payload;
        },
        addCard: function (state, action) {
            state.cards[action.payload.id] = action.payload;
        },
        addTemplate: function (state, action) {
            state.templates[action.payload.id] = action.payload;
        },
        updateCards: function (state, action) {
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var card = _a[_i];
                if (card.deletedAt !== 0) {
                    delete state.cards[card.id];
                    delete state.templates[card.id];
                }
                else if (card.fields.isTemplate) {
                    state.templates[card.id] = card;
                }
                else {
                    state.cards[card.id] = card;
                }
            }
        }
    },
    extraReducers: function (builder) {
        builder.addCase(initialLoad_1.initialReadOnlyLoad.fulfilled, function (state, action) {
            state.cards = {};
            state.templates = {};
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'card' && block.fields.isTemplate) {
                    state.templates[block.id] = block;
                }
                else if (block.type === 'card' && !block.fields.isTemplate) {
                    state.cards[block.id] = block;
                }
            }
        });
        builder.addCase(initialLoad_1.initialLoad.fulfilled, function (state, action) {
            state.cards = {};
            state.templates = {};
            var boardsRecord = {};
            action.payload.blocks.forEach(function (block) {
                if (block.type === 'board') {
                    boardsRecord[block.id] = block;
                }
            });
            for (var _i = 0, _a = action.payload.blocks; _i < _a.length; _i++) {
                var block = _a[_i];
                var boardPage = boardsRecord[block.parentId];
                // check boardPage exists, its possible a deleted card still exists. TODO: delete cards when a board is deleted!
                if (boardPage) {
                    // If the parent board block has been deleted, then doesn't matter which card has been deleted, show them all
                    // Otherwise dont show the card that has been deleted by itself
                    if (block.type === 'card' && ((boardPage.deletedAt === null && block.deletedAt === null) || boardPage.deletedAt !== null)) {
                        if (block.fields.isTemplate) {
                            state.templates[block.id] = block;
                        }
                        else {
                            state.cards[block.id] = block;
                        }
                    }
                }
            }
        });
    }
});
exports.updateCards = (_a = cardsSlice.actions, _a.updateCards), exports.addCard = _a.addCard, exports.addTemplate = _a.addTemplate, exports.setCurrent = _a.setCurrent;
exports.reducer = cardsSlice.reducer;
var getCards = function (state) { return state.cards.cards; };
exports.getCards = getCards;
exports.getSortedCards = (0, toolkit_1.createSelector)(exports.getCards, function (cards) {
    return Object.values(cards).sort(function (a, b) { return a.title.localeCompare(b.title); });
});
var getTemplates = function (state) { return state.cards.templates; };
exports.getTemplates = getTemplates;
exports.getSortedTemplates = (0, toolkit_1.createSelector)(exports.getTemplates, function (templates) {
    return Object.values(templates).sort(function (a, b) { return a.title.localeCompare(b.title); });
});
function getCard(cardId) {
    return function (state) {
        return state.cards.cards[cardId] || state.cards.templates[cardId];
    };
}
exports.getCard = getCard;
exports.getCurrentBoardCards = (0, toolkit_1.createSelector)(function (state) { return state.boards.current; }, exports.getCards, function (boardId, cards) {
    return Object.values(cards).filter(function (c) { return c.parentId === boardId; });
});
var getBoardCards = function (boardId) { return (0, toolkit_1.createSelector)(exports.getCards, function (cards) {
    return Object.values(cards).filter(function (c) { return c.parentId === boardId; });
}); };
exports.getBoardCards = getBoardCards;
exports.getCurrentBoardTemplates = (0, toolkit_1.createSelector)(function (state) { return state.boards.current; }, exports.getTemplates, function (boardId, templates) {
    return Object.values(templates).filter(function (c) { return c.parentId === boardId; });
});
function titleOrCreatedOrder(cardA, cardB) {
    var aValue = cardA.title;
    var bValue = cardB.title;
    if (aValue && bValue && aValue.localeCompare) {
        return aValue.localeCompare(bValue);
    }
    // Always put untitled cards at the bottom
    if (aValue && !bValue) {
        return -1;
    }
    if (bValue && !aValue) {
        return 1;
    }
    // If both cards are untitled, use the create date
    return cardA.createdAt - cardB.createdAt;
}
function manualOrder(activeView, cardA, cardB) {
    var indexA = activeView.fields.cardOrder.indexOf(cardA.id);
    var indexB = activeView.fields.cardOrder.indexOf(cardB.id);
    if (indexA < 0 && indexB < 0) {
        return titleOrCreatedOrder(cardA, cardB);
    }
    else if (indexA < 0 && indexB >= 0) {
        // If cardA's order is not defined, put it at the end
        return 1;
    }
    return indexA - indexB;
}
function sortCards(cards, board, activeView, usersById) {
    if (!activeView) {
        return cards;
    }
    var sortOptions = activeView.fields.sortOptions;
    if (sortOptions.length < 1) {
        utils_1.Utils.log('Manual sort');
        return cards.sort(function (a, b) { return manualOrder(activeView, a, b); });
    }
    var sortedCards = cards;
    var _loop_1 = function (sortOption) {
        if (sortOption.propertyId === constants_1.Constants.titleColumnId) {
            utils_1.Utils.log('Sort by title');
            sortedCards = sortedCards.sort(function (a, b) {
                var result = titleOrCreatedOrder(a, b);
                return sortOption.reversed ? -result : result;
            });
        }
        else {
            var sortPropertyId_1 = sortOption.propertyId;
            var template_1 = board.fields.cardProperties.find(function (o) { return o.id === sortPropertyId_1; });
            if (!template_1) {
                utils_1.Utils.logError("Missing template for property id: ".concat(sortPropertyId_1));
                return { value: sortedCards };
            }
            utils_1.Utils.log("Sort by property: ".concat(template_1 === null || template_1 === void 0 ? void 0 : template_1.name));
            sortedCards = sortedCards.sort(function (a, b) {
                var _a, _b, _c, _d, _e, _f;
                var aValue = a.fields.properties[sortPropertyId_1] || '';
                var bValue = b.fields.properties[sortPropertyId_1] || '';
                if (template_1.type === 'createdBy') {
                    aValue = ((_a = usersById[a.createdBy]) === null || _a === void 0 ? void 0 : _a.username) || '';
                    bValue = ((_b = usersById[b.createdBy]) === null || _b === void 0 ? void 0 : _b.username) || '';
                }
                else if (template_1.type === 'updatedBy') {
                    aValue = ((_c = usersById[a.updatedBy]) === null || _c === void 0 ? void 0 : _c.username) || '';
                    bValue = ((_d = usersById[b.updatedBy]) === null || _d === void 0 ? void 0 : _d.username) || '';
                }
                else if (template_1.type === 'date') {
                    aValue = (aValue === '') ? '' : JSON.parse(aValue).from;
                    bValue = (bValue === '') ? '' : JSON.parse(bValue).from;
                }
                var result = 0;
                if (template_1.type === 'number' || template_1.type === 'date') {
                    // Always put empty values at the bottom
                    if (aValue && !bValue) {
                        result = -1;
                    }
                    if (bValue && !aValue) {
                        result = 1;
                    }
                    if (!aValue && !bValue) {
                        result = titleOrCreatedOrder(a, b);
                    }
                    result = Number(aValue) - Number(bValue);
                }
                else if (template_1.type === 'createdTime') {
                    result = a.createdAt - b.createdAt;
                }
                else if (template_1.type === 'updatedTime') {
                    result = a.updatedAt - b.updatedAt;
                }
                else if (template_1.type === 'checkbox') {
                    // aValue will be true or empty string
                    if (aValue) {
                        result = 1;
                    }
                    else if (bValue) {
                        result = -1;
                    }
                    else {
                        result = titleOrCreatedOrder(a, b);
                    }
                }
                else {
                    // Text-based sort
                    if (aValue.length > 0 && bValue.length <= 0) {
                        result = -1;
                    }
                    if (bValue.length > 0 && aValue.length <= 0) {
                        result = 1;
                    }
                    if (aValue.length <= 0 && bValue.length <= 0) {
                        result = titleOrCreatedOrder(a, b);
                    }
                    if (template_1.type === 'select' || template_1.type === 'multiSelect') {
                        aValue = ((_e = template_1.options.find(function (o) { return o.id === (Array.isArray(aValue) ? aValue[0] : aValue); })) === null || _e === void 0 ? void 0 : _e.value) || '';
                        bValue = ((_f = template_1.options.find(function (o) { return o.id === (Array.isArray(bValue) ? bValue[0] : bValue); })) === null || _f === void 0 ? void 0 : _f.value) || '';
                    }
                    if (result == 0) {
                        result = aValue.localeCompare(bValue);
                    }
                }
                if (result === 0) {
                    // In case of "ties", use the title order
                    result = titleOrCreatedOrder(a, b);
                }
                return sortOption.reversed ? -result : result;
            });
        }
    };
    for (var _i = 0, sortOptions_1 = sortOptions; _i < sortOptions_1.length; _i++) {
        var sortOption = sortOptions_1[_i];
        var state_1 = _loop_1(sortOption);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return sortedCards;
}
function searchFilterCards(cards, board, searchTextRaw) {
    var searchText = searchTextRaw.toLocaleLowerCase();
    if (!searchText) {
        return cards.slice();
    }
    return cards.filter(function (card) {
        var _a;
        var searchTextInCardTitle = (_a = card.title) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase().includes(searchText);
        if (searchTextInCardTitle) {
            return true;
        }
        var _loop_2 = function (propertyId, propertyValue) {
            // TODO: Refactor to a shared function that returns the display value of a property
            var propertyTemplate = board.fields.cardProperties.find(function (o) { return o.id === propertyId; });
            if (propertyTemplate) {
                if (propertyTemplate.type === 'select') {
                    // Look up the value of the select option
                    var option = propertyTemplate.options.find(function (o) { return o.id === propertyValue; });
                    if (option === null || option === void 0 ? void 0 : option.value.toLowerCase().includes(searchText)) {
                        return { value: true };
                    }
                }
                else if (propertyTemplate.type === 'multiSelect') {
                    // Look up the value of the select option
                    var options = propertyValue.map(function (value) { var _a; return (_a = propertyTemplate.options.find(function (o) { return o.id === value; })) === null || _a === void 0 ? void 0 : _a.value.toLowerCase(); });
                    if (options === null || options === void 0 ? void 0 : options.includes(searchText)) {
                        return { value: true };
                    }
                }
                else if (propertyValue.toLowerCase().includes(searchText)) {
                    return { value: true };
                }
            }
        };
        for (var _i = 0, _b = Object.entries(card.fields.properties); _i < _b.length; _i++) {
            var _c = _b[_i], propertyId = _c[0], propertyValue = _c[1];
            var state_2 = _loop_2(propertyId, propertyValue);
            if (typeof state_2 === "object")
                return state_2.value;
        }
        return false;
    });
}
exports.getCurrentViewCardsSortedFilteredAndGrouped = (0, toolkit_1.createSelector)(exports.getCurrentBoardCards, boards_1.getCurrentBoard, views_1.getCurrentView, searchText_1.getSearchText, users_1.getWorkspaceUsers, function (cards, board, view, searchText, users) {
    if (!view || !board || !users || !cards) {
        return [];
    }
    var result = cards;
    if (view.fields.filter) {
        result = cardFilter_1.CardFilter.applyFilterGroup(view.fields.filter, board.fields.cardProperties, result);
    }
    if (searchText) {
        result = searchFilterCards(result, board, searchText);
    }
    result = sortCards(result, board, view, users);
    return result;
});
var getViewCardsSortedFilteredAndGrouped = function (props) { return (0, toolkit_1.createSelector)((0, exports.getBoardCards)(props.boardId), (0, boards_1.getBoard)(props.boardId), (0, views_1.getView)(props.viewId), users_1.getWorkspaceUsers, function (cards, board, view, users) {
    if (!view || !board || !users || !cards) {
        return [];
    }
    var result = cards;
    if (view.fields.filter) {
        result = cardFilter_1.CardFilter.applyFilterGroup(view.fields.filter, board.fields.cardProperties, result);
    }
    result = sortCards(result, board, view, users);
    return result;
}); };
exports.getViewCardsSortedFilteredAndGrouped = getViewCardsSortedFilteredAndGrouped;
