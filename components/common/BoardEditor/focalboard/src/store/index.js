"use strict";
exports.__esModule = true;
var toolkit_1 = require("@reduxjs/toolkit");
var users_1 = require("./users");
var language_1 = require("./language");
var globalTemplates_1 = require("./globalTemplates");
var boards_1 = require("./boards");
var views_1 = require("./views");
var cards_1 = require("./cards");
var comments_1 = require("./comments");
var searchText_1 = require("./searchText");
var globalError_1 = require("./globalError");
var clientConfig_1 = require("./clientConfig");
var store = (0, toolkit_1.configureStore)({
    reducer: {
        users: users_1.reducer,
        language: language_1.reducer,
        globalTemplates: globalTemplates_1.reducer,
        boards: boards_1.reducer,
        views: views_1.reducer,
        cards: cards_1.reducer,
        comments: comments_1.reducer,
        searchText: searchText_1.reducer,
        globalError: globalError_1.reducer,
        clientConfig: clientConfig_1.reducer
    }
});
exports["default"] = store;
