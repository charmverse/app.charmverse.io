"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var react_redux_1 = require("react-redux");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var mutator_1 = require("../../mutator");
var utils_1 = require("../../utils");
var octoClient_1 = require("../../octoClient");
var galleryCard_1 = require("./galleryCard");
jest.mock('../../mutator');
jest.mock('../../utils');
jest.mock('../../octoClient');
describe('src/components/gallery/GalleryCard', function () {
    var mockedMutator = jest.mocked(mutator_1["default"], true);
    var mockedUtils = jest.mocked(utils_1.Utils, true);
    var mockedOcto = jest.mocked(octoClient_1["default"], true);
    mockedOcto.getFileAsDataUrl.mockResolvedValue('test.jpg');
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.id = 'boardId';
    var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    activeView.fields.sortOptions = [];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.id = 'cardId';
    var contentImage = testBlockFactory_1.TestBlockFactory.createImage(card);
    contentImage.id = 'contentId-image';
    contentImage.fields.fileId = 'test.jpg';
    var contentComment = testBlockFactory_1.TestBlockFactory.createComment(card);
    contentComment.id = 'contentId-Comment';
    var store;
    beforeEach(function () {
        jest.clearAllMocks();
    });
    describe('without block content', function () {
        beforeEach(function () {
            var _a;
            var state = {
                contents: {
                    contents: {}
                },
                cards: {
                    cards: (_a = {},
                        _a[card.id] = card,
                        _a)
                },
                comments: {
                    comments: {}
                }
            };
            store = (0, testUtils_1.mockStateStore)([], state);
        });
        test('should match snapshot', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[{ id: card.id, name: 'testTemplateProperty', type: 'text', options: [{ id: '1', value: 'testValue', color: 'blue' }] }]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            expect(container).toMatchSnapshot();
        });
        test('return GalleryCard and click on it', function () {
            var mockedOnClick = jest.fn();
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={mockedOnClick} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var galleryCardElement = container.querySelector('.GalleryCard');
            user_event_1["default"].click(galleryCardElement);
            expect(mockedOnClick).toBeCalledTimes(1);
        });
        test('return GalleryCard and delete card', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            var buttonDelete = react_2.screen.getByRole('button', { name: 'Delete' });
            user_event_1["default"].click(buttonDelete);
            expect(container).toMatchSnapshot();
            expect(mockedMutator.deleteBlock).toBeCalledTimes(1);
            expect(mockedMutator.deleteBlock).toBeCalledWith(card, 'delete card');
        });
        test('return GalleryCard and duplicate card', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            var buttonDuplicate = react_2.screen.getByRole('button', { name: 'Duplicate' });
            user_event_1["default"].click(buttonDuplicate);
            expect(container).toMatchSnapshot();
            expect(mockedMutator.duplicateCard).toBeCalledTimes(1);
            expect(mockedMutator.duplicateCard).toBeCalledWith(card.id, board);
        });
        test('return GalleryCard and copy link', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            var buttonCopyLink = react_2.screen.getByRole('button', { name: 'Copy link' });
            user_event_1["default"].click(buttonCopyLink);
            expect(container).toMatchSnapshot();
            expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1);
        });
        test('return GalleryCard and cancel', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            var buttonCancel = react_2.screen.getByRole('button', { name: 'Cancel' });
            user_event_1["default"].click(buttonCancel);
            expect(container).toMatchSnapshot();
        });
    });
    describe('with an image content', function () {
        beforeEach(function () {
            var _a, _b;
            card.fields.contentOrder = [contentImage.id];
            var state = {
                contents: {
                    contents: (_a = {},
                        _a[contentImage.id] = contentImage,
                        _a)
                },
                cards: {
                    cards: (_b = {},
                        _b[card.id] = card,
                        _b)
                },
                comments: {
                    comments: {}
                }
            };
            store = (0, testUtils_1.mockStateStore)([], state);
        });
        test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
            var container;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
                        return [4 /*yield*/, (0, react_2.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                                var buttonElement;
                                return __generator(this, function (_a) {
                                    buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
                                    user_event_1["default"].click(buttonElement);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        expect(container).toMatchSnapshot();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('with many images content', function () {
        beforeEach(function () {
            var _a, _b;
            var contentImage2 = testBlockFactory_1.TestBlockFactory.createImage(card);
            contentImage2.id = 'contentId-image2';
            contentImage2.fields.fileId = 'test2.jpg';
            card.fields.contentOrder = [contentImage.id, contentImage2.id];
            var state = {
                contents: {
                    contents: (_a = {},
                        _a[contentImage.id] = [contentImage],
                        _a[contentImage2.id] = [contentImage2],
                        _a)
                },
                cards: {
                    cards: (_b = {},
                        _b[card.id] = card,
                        _b)
                },
                comments: {
                    comments: {}
                }
            };
            store = (0, testUtils_1.mockStateStore)([], state);
        });
        test('should match snapshot with only first image', function () { return __awaiter(void 0, void 0, void 0, function () {
            var container;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
                        return [4 /*yield*/, (0, react_2.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                                var buttonElement;
                                return __generator(this, function (_a) {
                                    buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
                                    user_event_1["default"].click(buttonElement);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        expect(container).toMatchSnapshot();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('with a comment content', function () {
        beforeEach(function () {
            var _a, _b;
            card.fields.contentOrder = [contentComment.id];
            var state = {
                contents: {
                    contents: (_a = {},
                        _a[contentComment.id] = contentComment,
                        _a)
                },
                cards: {
                    cards: (_b = {},
                        _b[card.id] = card,
                        _b)
                },
                comments: {
                    comments: {}
                }
            };
            store = (0, testUtils_1.mockStateStore)([], state);
        });
        test('should match snapshot', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            expect(container).toMatchSnapshot();
        });
        test('return GalleryCard with content readonly', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={true} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            expect(container).toMatchSnapshot();
        });
    });
    describe('with many contents', function () {
        var contentDivider = testBlockFactory_1.TestBlockFactory.createDivider(card);
        contentDivider.id = 'contentId-Text2';
        beforeEach(function () {
            var _a, _b;
            card.fields.contentOrder = [contentComment.id, contentDivider.id];
            var state = {
                contents: {
                    contents: (_a = {},
                        _a[contentComment.id] = [contentComment, contentDivider],
                        _a)
                },
                cards: {
                    cards: (_b = {},
                        _b[card.id] = card,
                        _b)
                },
                comments: {
                    comments: {}
                }
            };
            store = (0, testUtils_1.mockStateStore)([], state);
        });
        test('should match snapshot', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={false} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            var buttonElement = react_2.screen.getByRole('button', { name: 'menuwrapper' });
            user_event_1["default"].click(buttonElement);
            expect(container).toMatchSnapshot();
        });
        test('return GalleryCard with contents readonly', function () {
            var container = (0, react_2.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <galleryCard_1["default"] board={board} card={card} onClick={jest.fn()} visiblePropertyTemplates={[]} visibleTitle={true} isSelected={true} visibleBadges={false} readonly={true} isManualSort={true} onDrop={jest.fn()}/>
        </react_redux_1.Provider>)).container;
            expect(container).toMatchSnapshot();
        });
    });
});
