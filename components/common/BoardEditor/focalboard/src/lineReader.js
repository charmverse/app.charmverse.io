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
exports.LineReader = void 0;
var LineReader = /** @class */ (function () {
    function LineReader() {
    }
    LineReader.appendBuffer = function (buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(buffer1, 0);
        tmp.set(buffer2, buffer1.byteLength);
        return tmp;
    };
    LineReader.arrayBufferIndexOf = function (buffer, charCode) {
        for (var i = 0; i < buffer.byteLength; ++i) {
            if (buffer[i] === charCode) {
                return i;
            }
        }
        return -1;
    };
    LineReader.readFile = function (file, callback) {
        var _this = this;
        var buffer = new Uint8Array(0);
        var chunkSize = 1024 * 1000;
        var offset = 0;
        var fr = new FileReader();
        var decoder = new TextDecoder();
        fr.onload = function () { return __awaiter(_this, void 0, void 0, function () {
            var chunk, newlineChar, newlineIndex, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chunk = new Uint8Array(fr.result);
                        buffer = LineReader.appendBuffer(buffer, chunk);
                        newlineChar = 10;
                        newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar);
                        _a.label = 1;
                    case 1:
                        if (!(newlineIndex >= 0)) return [3 /*break*/, 3];
                        result = decoder.decode(buffer.slice(0, newlineIndex));
                        buffer = buffer.slice(newlineIndex + 1);
                        return [4 /*yield*/, callback(result, false)];
                    case 2:
                        _a.sent();
                        newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar);
                        return [3 /*break*/, 1];
                    case 3:
                        offset += chunkSize;
                        if (!(offset >= file.size)) return [3 /*break*/, 7];
                        if (!(buffer.byteLength > 0)) return [3 /*break*/, 5];
                        // Handle last line
                        return [4 /*yield*/, callback(decoder.decode(buffer), false)];
                    case 4:
                        // Handle last line
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, callback('', true)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                    case 7:
                        seek();
                        return [2 /*return*/];
                }
            });
        }); };
        fr.onerror = function () {
            callback('', true);
        };
        seek();
        function seek() {
            var slice = file.slice(offset, offset + chunkSize);
            // Need to read as an ArrayBuffer (instead of text) to handle unicode boundaries
            fr.readAsArrayBuffer(slice);
        }
    };
    return LineReader;
}());
exports.LineReader = LineReader;
