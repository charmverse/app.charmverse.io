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
exports.IDType = exports.Utils = void 0;
var marked_1 = require("marked");
var luxon_1 = require("luxon");
var uuid_1 = require("uuid");
var log_1 = require("lib/log");
var board_1 = require("./blocks/board");
var boardView_1 = require("./blocks/boardView");
var card_1 = require("./blocks/card");
var commentBlock_1 = require("./blocks/commentBlock");
var IconClass = 'octo-icon';
var OpenButtonClass = 'open-button';
var SpacerClass = 'octo-spacer';
var HorizontalGripClass = 'HorizontalGrip';
var base32Alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769';
// eslint-disable-next-line no-shadow
var IDType;
(function (IDType) {
    IDType["None"] = "7";
    IDType["Workspace"] = "w";
    IDType["Board"] = "b";
    IDType["Card"] = "c";
    IDType["View"] = "v";
    IDType["Session"] = "s";
    IDType["User"] = "u";
    IDType["Token"] = "k";
    IDType["BlockID"] = "a";
})(IDType || (IDType = {}));
exports.IDType = IDType;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.createGuid = function (idType) {
        return (0, uuid_1.v4)(); // idType + Utils.base32encode(data, false)
    };
    Utils.blockTypeToIDType = function (blockType) {
        var ret = IDType.None;
        switch (blockType) {
            case 'workspace':
                ret = IDType.Workspace;
                break;
            case 'board':
                ret = IDType.Board;
                break;
            case 'card':
                ret = IDType.Card;
                break;
            case 'view':
                ret = IDType.View;
                break;
        }
        return ret;
    };
    Utils.randomArray = function (size) {
        var crypto = window.crypto || window.msCrypto;
        var rands = new Uint8Array(size);
        if (crypto && crypto.getRandomValues) {
            crypto.getRandomValues(rands);
        }
        else {
            for (var i = 0; i < size; i++) {
                rands[i] = Math.floor((Math.random() * 255));
            }
        }
        return rands;
    };
    Utils.base32encode = function (data, pad) {
        var dview = new DataView(data.buffer, data.byteOffset, data.byteLength);
        var bits = 0;
        var value = 0;
        var output = '';
        // adapted from https://github.com/LinusU/base32-encode
        for (var i = 0; i < dview.byteLength; i++) {
            value = (value << 8) | dview.getUint8(i);
            bits += 8;
            while (bits >= 5) {
                output += base32Alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += base32Alphabet[(value << (5 - bits)) & 31];
        }
        if (pad) {
            while ((output.length % 8) !== 0) {
                output += '=';
            }
        }
        return output;
    };
    Utils.htmlToElement = function (html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    };
    Utils.getElementById = function (elementId) {
        var element = document.getElementById(elementId);
        Utils.assert(element, "getElementById \"".concat(elementId, "$"));
        return element;
    };
    Utils.htmlEncode = function (text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };
    Utils.htmlDecode = function (text) {
        return String(text).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    };
    Utils.getTextWidth = function (displayText, fontDescriptor) {
        if (displayText !== '') {
            if (!Utils.canvas) {
                Utils.canvas = document.createElement('canvas');
            }
            var context = Utils.canvas.getContext('2d');
            if (context) {
                context.font = fontDescriptor;
                var metrics = context.measureText(displayText);
                return Math.ceil(metrics.width);
            }
        }
        return 0;
    };
    Utils.getFontString = function (style) {
        if (style.font) {
            return style.font;
        }
        var fontStyle = style.fontStyle, fontVariant = style.fontVariant, fontWeight = style.fontWeight, fontSize = style.fontSize, lineHeight = style.lineHeight, fontFamily = style.fontFamily;
        var props = [fontStyle, fontVariant, fontWeight];
        if (fontSize) {
            props.push(lineHeight ? "".concat(fontSize, " / ").concat(lineHeight) : fontSize);
        }
        props.push(fontFamily);
        return props.join(' ');
    };
    Utils.getHorizontalMargin = function (style) {
        return parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
    };
    Utils.getHorizontalBorder = function (style) {
        return parseInt(style.borderLeftWidth, 10) + parseInt(style.borderRightWidth, 10);
    };
    Utils.getHorizontalPadding = function (style) {
        return parseInt(style.paddingLeft, 10) + parseInt(style.paddingRight, 10);
    };
    Utils.getTotalHorizontalPadding = function (style) {
        return Utils.getHorizontalPadding(style) + Utils.getHorizontalMargin(style) + Utils.getHorizontalBorder(style);
    };
    // Markdown
    Utils.htmlFromMarkdown = function (text) {
        // HACKHACK: Somehow, marked doesn't encode angle brackets
        var renderer = new marked_1.marked.Renderer();
        renderer.link = function (href, title, contents) {
            return '<a '
                + 'target="_blank" '
                + 'rel="noreferrer" '
                + "href=\"".concat(encodeURI(href || ''), "\" ")
                + "title=\"".concat(title ? encodeURI(title) : '', "\" ")
                + "onclick=\"".concat((window.openInNewBrowser ? ' openInNewBrowser && openInNewBrowser(event.target.href);' : ''), "\"")
                + ">".concat(contents, "</a>");
        };
        renderer.table = function (header, body) {
            return "<div class=\"table-responsive\"><table class=\"markdown__table\"><thead>".concat(header, "</thead><tbody>").concat(body, "</tbody></table></div>");
        };
        return this.htmlFromMarkdownWithRenderer(text, renderer);
    };
    Utils.htmlFromMarkdownWithRenderer = function (text, renderer) {
        var html = (0, marked_1.marked)(text.replace(/</g, '&lt;'), { renderer: renderer, breaks: true });
        return html.trim();
    };
    Utils.countCheckboxesInMarkdown = function (text) {
        var total = 0;
        var checked = 0;
        var renderer = new marked_1.marked.Renderer();
        renderer.checkbox = function (isChecked) {
            ++total;
            if (isChecked) {
                ++checked;
            }
            return '';
        };
        this.htmlFromMarkdownWithRenderer(text, renderer);
        return { total: total, checked: checked };
    };
    // Date and Time
    Utils.yearOption = function (date) {
        var isCurrentYear = date.getFullYear() === new Date().getFullYear();
        return isCurrentYear ? undefined : 'numeric';
    };
    Utils.displayDate = function (date, intl) {
        return intl.formatDate(date, {
            year: Utils.yearOption(date),
            month: 'long',
            day: '2-digit'
        });
    };
    Utils.inputDate = function (date, intl) {
        return intl.formatDate(date, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };
    Utils.displayDateTime = function (date, intl) {
        return intl.formatDate(date, {
            year: Utils.yearOption(date),
            month: 'long',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric'
        });
    };
    Utils.relativeDisplayDateTime = function (date, intl) {
        return luxon_1.DateTime.fromJSDate(date).setLocale(intl.locale.toLowerCase()).toRelativeCalendar() || '';
    };
    Utils.sleep = function (miliseconds) {
        return new Promise(function (resolve) { return setTimeout(resolve, miliseconds); });
    };
    // Errors
    Utils.assertValue = function (valueObject) {
        var name = Object.keys(valueObject)[0];
        var value = valueObject[name];
        if (!value) {
            log_1["default"].error("ASSERT VALUE [".concat(name, "]"));
        }
    };
    Utils.assert = function (condition, tag) {
        if (tag === void 0) { tag = ''; }
        /// #!if ENV !== "production"
        if (!condition) {
            log_1["default"].error("ASSERT [".concat(tag !== null && tag !== void 0 ? tag : new Error().stack, "]"));
        }
        /// #!endif
    };
    Utils.assertFailure = function (tag) {
        if (tag === void 0) { tag = ''; }
        /// #!if ENV !== "production"
        Utils.assert(false, tag);
        /// #!endif
    };
    Utils.log = function (message) {
        /// #!if ENV !== "production"
        var timestamp = (Date.now() / 1000).toFixed(2);
        // eslint-disable-next-line no-console
        console.log("[".concat(timestamp, "] ").concat(message));
        /// #!endif
    };
    Utils.logError = function (message) {
        /// #!if ENV !== "production"
        // eslint-disable-next-line no-console
        log_1["default"].error(message);
        /// #!endif
    };
    Utils.logWarn = function (message) {
        /// #!if ENV !== "production"
        // eslint-disable-next-line no-console
        log_1["default"].warn(message);
        /// #!endif
    };
    // favicon
    Utils.setFavicon = function (icon) {
        var _a;
        if (Utils.isFocalboardPlugin()) {
            // Do not change the icon from focalboard plugin
            return;
        }
        if (!icon) {
            (_a = document.querySelector("link[rel*='icon']")) === null || _a === void 0 ? void 0 : _a.remove();
            return;
        }
        var link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><text y=\".9em\" font-size=\"90\">".concat(icon, "</text></svg>");
        document.querySelectorAll("link[rel*='icon']").forEach(function (n) { return n.remove(); });
        document.getElementsByTagName('head')[0].appendChild(link);
    };
    // URL
    Utils.replaceUrlQueryParam = function (paramName, value) {
        var queryString = new URLSearchParams(window.location.search);
        var currentValue = queryString.get(paramName) || '';
        if (currentValue !== value) {
            var newUrl = new URL(window.location.toString());
            if (value) {
                newUrl.searchParams.set(paramName, value);
            }
            else {
                newUrl.searchParams["delete"](paramName);
            }
            window.history.pushState({}, document.title, newUrl.toString());
        }
    };
    Utils.ensureProtocol = function (url) {
        return url.match(/^.+:\/\//) ? url : "https://".concat(url);
    };
    // File names
    Utils.sanitizeFilename = function (filename) {
        // TODO: Use an industrial-strength sanitizer
        var sanitizedFilename = filename;
        var illegalCharacters = ['\\', '/', '?', ':', '<', '>', '*', '|', '"', '.'];
        illegalCharacters.forEach(function (character) {
            sanitizedFilename = sanitizedFilename.replace(character, '');
        });
        return sanitizedFilename;
    };
    // File picker
    Utils.selectLocalFile = function (onSelect, accept) {
        var _this = this;
        if (accept === void 0) { accept = '.jpg,.jpeg,.png'; }
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = function () { return __awaiter(_this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                file = input.files[0];
                onSelect === null || onSelect === void 0 ? void 0 : onSelect(file);
                return [2 /*return*/];
            });
        }); };
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        // TODO: Remove or reuse input
    };
    // Arrays
    Utils.arraysEqual = function (a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null) {
            return false;
        }
        if (a === undefined || b === undefined) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    };
    Utils.arrayMove = function (arr, srcIndex, destIndex) {
        arr.splice(destIndex, 0, arr.splice(srcIndex, 1)[0]);
    };
    // Clipboard
    Utils.copyTextToClipboard = function (text) {
        var result = false;
        try {
            navigator.clipboard.writeText(text);
            result = true;
        }
        catch (err) {
            Utils.logError("copyTextToClipboard ERROR: ".concat(err));
            result = false;
        }
        return result;
    };
    Utils.getBaseURL = function (absolute) {
        var baseURL = window.baseURL || '';
        baseURL = baseURL.replace(/\/+$/, '');
        if (baseURL.indexOf('/') === 0) {
            baseURL = baseURL.slice(1);
        }
        if (absolute) {
            return "".concat(window.location.origin, "/").concat(baseURL);
        }
        return baseURL;
    };
    Utils.getFrontendBaseURL = function (absolute) {
        var frontendBaseURL = window.frontendBaseURL || Utils.getBaseURL(absolute);
        frontendBaseURL = frontendBaseURL.replace(/\/+$/, '');
        if (frontendBaseURL.indexOf('/') === 0) {
            frontendBaseURL = frontendBaseURL.slice(1);
        }
        if (absolute) {
            return "".concat(window.location.origin, "/").concat(frontendBaseURL);
        }
        return frontendBaseURL;
    };
    Utils.buildURL = function (path, absolute) {
        var baseURL = Utils.getBaseURL();
        var finalPath = baseURL + path;
        if (path.indexOf('/') !== 0) {
            finalPath = "".concat(baseURL, "/").concat(path);
        }
        if (absolute) {
            if (finalPath.indexOf('/') === 0) {
                finalPath = finalPath.slice(1);
            }
            return "".concat(window.location.origin, "/").concat(finalPath);
        }
        return finalPath;
    };
    Utils.roundTo = function (num, decimalPlaces) {
        return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    };
    Utils.isFocalboardPlugin = function () {
        return Boolean(window.isFocalboardPlugin);
    };
    // this is a temporary solution while we're using legacy routes
    // for shared boards as a way to check if we're accessing the
    // legacy routes inside the plugin
    Utils.isFocalboardLegacy = function () {
        return window.location.pathname.includes('/plugins/focalboard');
    };
    Utils.fixBlock = function (block) {
        switch (block.type) {
            case 'board':
                return (0, board_1.createBoard)({ block: block });
            case 'view':
                return (0, boardView_1.createBoardView)(block);
            case 'card':
                return (0, card_1.createCard)(block);
            case 'comment':
                return (0, commentBlock_1.createCommentBlock)(block);
            default:
                return block;
        }
    };
    Utils.userAgent = function () {
        return window.navigator.userAgent;
    };
    Utils.isDesktopApp = function () {
        return Utils.userAgent().indexOf('Mattermost') !== -1 && Utils.userAgent().indexOf('Electron') !== -1;
    };
    Utils.getDesktopVersion = function () {
        var _a;
        // use if the value window.desktop.version is not set yet
        var regex = /Mattermost\/(\d+\.\d+\.\d+)/gm;
        var match = ((_a = regex.exec(window.navigator.appVersion)) === null || _a === void 0 ? void 0 : _a[1]) || '';
        return match;
    };
    /**
       * Function to check how a version compares to another
       *
       * eg.  versionA = 4.16.0, versionB = 4.17.0 returns  1
       *      versionA = 4.16.1, versionB = 4.16.1 returns  0
       *      versionA = 4.16.1, versionB = 4.15.0 returns -1
       */
    Utils.compareVersions = function (versionA, versionB) {
        if (versionA === versionB) {
            return 0;
        }
        // We only care about the numbers
        var versionANumber = (versionA || '').split('.').filter(function (x) { return (/^[0-9]+$/).exec(x) !== null; });
        var versionBNumber = (versionB || '').split('.').filter(function (x) { return (/^[0-9]+$/).exec(x) !== null; });
        for (var i = 0; i < Math.max(versionANumber.length, versionBNumber.length); i++) {
            var a = parseInt(versionANumber[i], 10) || 0;
            var b = parseInt(versionBNumber[i], 10) || 0;
            if (a > b) {
                return -1;
            }
            if (a < b) {
                return 1;
            }
        }
        // If all components are equal, then return true
        return 0;
    };
    Utils.isDesktop = function () {
        return Utils.isDesktopApp() && (Utils.compareVersions(Utils.getDesktopVersion(), '5.0.0') <= 0);
    };
    Utils.getReadToken = function () {
        var queryString = new URLSearchParams(window.location.search);
        var readToken = queryString.get('r') || '';
        return readToken;
    };
    Utils.generateClassName = function (conditions) {
        return Object.entries(conditions).map(function (_a) {
            var className = _a[0], condition = _a[1];
            return (condition ? className : '');
        }).filter(function (className) { return className !== ''; }).join(' ');
    };
    Utils.buildOriginalPath = function (workspaceId, boardId, viewId, cardId) {
        if (workspaceId === void 0) { workspaceId = ''; }
        if (boardId === void 0) { boardId = ''; }
        if (viewId === void 0) { viewId = ''; }
        if (cardId === void 0) { cardId = ''; }
        var originalPath = '';
        if (workspaceId) {
            originalPath += "".concat(workspaceId, "/");
        }
        if (boardId) {
            originalPath += "".concat(boardId, "/");
        }
        if (viewId) {
            originalPath += "".concat(viewId, "/");
        }
        if (cardId) {
            originalPath += "".concat(cardId, "/");
        }
        return originalPath;
    };
    Utils.getFontAndPaddingFromCell = function (cell) {
        var style = getComputedStyle(cell);
        var padding = Utils.getTotalHorizontalPadding(style);
        return Utils.getFontAndPaddingFromChildren(cell.children, padding);
    };
    // recursive routine to determine the padding and font from its children
    // specifically for the table view
    Utils.getFontAndPaddingFromChildren = function (children, pad) {
        var myResults = {
            fontDescriptor: '',
            padding: pad
        };
        Array.from(children).forEach(function (element) {
            var style = getComputedStyle(element);
            if (element.tagName === 'svg') {
                // clientWidth already includes padding
                myResults.padding += element.clientWidth;
                myResults.padding += Utils.getHorizontalBorder(style);
                myResults.padding += Utils.getHorizontalMargin(style);
                myResults.fontDescriptor = Utils.getFontString(style);
            }
            else {
                switch (element.className) {
                    case IconClass:
                    case HorizontalGripClass:
                        myResults.padding += element.clientWidth;
                        break;
                    case SpacerClass:
                    case OpenButtonClass:
                        break;
                    default: {
                        myResults.fontDescriptor = Utils.getFontString(style);
                        myResults.padding += Utils.getTotalHorizontalPadding(style);
                        var childResults = Utils.getFontAndPaddingFromChildren(element.children, myResults.padding);
                        if (childResults.fontDescriptor !== '') {
                            myResults.fontDescriptor = childResults.fontDescriptor;
                            myResults.padding = childResults.padding;
                        }
                    }
                }
            }
        });
        return myResults;
    };
    return Utils;
}());
exports.Utils = Utils;
