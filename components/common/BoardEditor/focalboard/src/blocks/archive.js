"use strict";
exports.__esModule = true;
exports.ArchiveUtils = void 0;
var ArchiveUtils = /** @class */ (function () {
    function ArchiveUtils() {
    }
    ArchiveUtils.buildBlockArchive = function (blocks) {
        var header = {
            version: 1,
            date: Date.now()
        };
        var headerString = JSON.stringify(header);
        var content = "".concat(headerString, "\n");
        for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
            var block = blocks_1[_i];
            var line = {
                type: 'block',
                data: block
            };
            var lineString = JSON.stringify(line);
            content += lineString;
            content += '\n';
        }
        return content;
    };
    ArchiveUtils.parseBlockArchive = function (contents) {
        var blocks = [];
        var allLineStrings = contents.split('\n');
        if (allLineStrings.length >= 2) {
            var headerString = allLineStrings[0];
            var header = JSON.parse(headerString);
            if (header.date && header.version >= 1) {
                var lineStrings = allLineStrings.slice(1);
                var lineNum = 2;
                for (var _i = 0, lineStrings_1 = lineStrings; _i < lineStrings_1.length; _i++) {
                    var lineString = lineStrings_1[_i];
                    if (!lineString) {
                        // Ignore empty lines, e.g. last line
                        continue;
                    }
                    var line = JSON.parse(lineString);
                    if (!line || !line.type || !line.data) {
                        throw new Error("ERROR parsing line ".concat(lineNum));
                    }
                    switch (line.type) {
                        case 'block': {
                            var blockLine = line;
                            var block = blockLine.data;
                            blocks.push(block);
                            break;
                        }
                    }
                    lineNum += 1;
                }
            }
            else {
                throw new Error('ERROR parsing header');
            }
        }
        return blocks;
    };
    return ArchiveUtils;
}());
exports.ArchiveUtils = ArchiveUtils;
