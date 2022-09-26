"use strict";
var _a;
exports.__esModule = true;
exports.getCurrentBoard = exports.getBoard = exports.getSortedTemplates = exports.getTemplates = exports.getSortedBoards = exports.getBoards = exports.reducer = exports.addBoard = exports.setCurrent = exports.updateBoards = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
var initialLoad_1 = require("./initialLoad");
var boardsSlice = (0, toolkit_1.createSlice)({
    name: 'boards',
    initialState: { boards: {}, templates: {} },
    reducers: {
        setCurrent: function (state, action) {
            state.current = action.payload;
        },
        addBoard: function (state, action) {
            state.boards[action.payload.id] = action.payload;
        },
        updateBoards: function (state, action) {
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var board = _a[_i];
                /* if (board.deletedAt !== 0 && board.deletedAt !== null) {
                            delete state.boards[board.id]
                            delete state.templates[board.id]
                        } else */
                if (board.fields.isTemplate) {
                    state.templates[board.id] = board;
                }
                else {
                    state.boards[board.id] = board;
                }
            }
        }
    },
    extraReducers: function (builder) {
        builder.addCase(initialLoad_1.initialReadOnlyLoad.fulfilled, function (state, action) {
            state.boards = {};
            state.templates = {};
            for (var _i = 0, _a = action.payload; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'board' && block.fields.isTemplate) {
                    state.templates[block.id] = block;
                }
                else if (block.type === 'board' && !block.fields.isTemplate) {
                    state.boards[block.id] = block;
                }
            }
        });
        builder.addCase(initialLoad_1.initialLoad.fulfilled, function (state, action) {
            state.boards = {};
            state.templates = {};
            for (var _i = 0, _a = action.payload.blocks; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type === 'board' && block.fields.isTemplate) {
                    state.templates[block.id] = block;
                }
                else if (block.type === 'board' && !block.fields.isTemplate) {
                    state.boards[block.id] = block;
                }
            }
        });
    }
});
exports.updateBoards = (_a = boardsSlice.actions, _a.updateBoards), exports.setCurrent = _a.setCurrent, exports.addBoard = _a.addBoard;
exports.reducer = boardsSlice.reducer;
var getBoards = function (state) { return state.boards.boards; };
exports.getBoards = getBoards;
exports.getSortedBoards = (0, toolkit_1.createSelector)(exports.getBoards, function (boards) {
    return Object.values(boards).sort(function (a, b) { return a.title.localeCompare(b.title); });
});
var getTemplates = function (state) { return state.boards.templates; };
exports.getTemplates = getTemplates;
exports.getSortedTemplates = (0, toolkit_1.createSelector)(exports.getTemplates, function (templates) {
    return Object.values(templates).sort(function (a, b) { return a.title.localeCompare(b.title); });
});
function getBoard(boardId) {
    return function (state) {
        return state.boards.boards[boardId] || state.boards.templates[boardId] || null;
    };
}
exports.getBoard = getBoard;
exports.getCurrentBoard = (0, toolkit_1.createSelector)(function (state) { return state.boards.current; }, exports.getBoards, exports.getTemplates, function (boardId, boards, templates) {
    return boards[boardId] || templates[boardId];
});
