"use strict";
exports.__esModule = true;
var react_intl_1 = require("react-intl");
var utils_1 = require("./utils");
describe('utils', function () {
    describe('assureProtocol', function () {
        test('should passthrough on valid short protocol', function () {
            expect(utils_1.Utils.ensureProtocol('https://focalboard.com')).toBe('https://focalboard.com');
        });
        test('should passthrough on valid long protocol', function () {
            expect(utils_1.Utils.ensureProtocol('somecustomprotocol://focalboard.com')).toBe('somecustomprotocol://focalboard.com');
        });
        test('should passthrough on valid short protocol', function () {
            expect(utils_1.Utils.ensureProtocol('x://focalboard.com')).toBe('x://focalboard.com');
        });
        test('should add a https for empty protocol', function () {
            expect(utils_1.Utils.ensureProtocol('focalboard.com')).toBe('https://focalboard.com');
        });
    });
    describe('createGuid', function () {
        test('should create 27 char random id for workspace', function () {
            expect(utils_1.Utils.createGuid(utils_1.IDType.Workspace)).toMatch(/^w[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/);
        });
        test('should create 27 char random id for board', function () {
            expect(utils_1.Utils.createGuid(utils_1.IDType.Board)).toMatch(/^b[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/);
        });
        test('should create 27 char random id for card', function () {
            expect(utils_1.Utils.createGuid(utils_1.IDType.Card)).toMatch(/^c[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/);
        });
        test('should create 27 char random id', function () {
            expect(utils_1.Utils.createGuid(utils_1.IDType.None)).toMatch(/^7[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/);
        });
    });
    describe('htmlFromMarkdown', function () {
        test('should not allow XSS on links href on the webapp', function () {
            expect(utils_1.Utils.htmlFromMarkdown('[]("xss-attack="true"other="whatever)')).toBe('<p><a target="_blank" rel="noreferrer" href="%22xss-attack=%22true%22other=%22whatever" title="" onclick=""></a></p>');
        });
        test('should not allow XSS on links href on the desktop app', function () {
            window.openInNewBrowser = function () { return null; };
            var expectedHtml = '<p><a target="_blank" rel="noreferrer" href="%22xss-attack=%22true%22other=%22whatever" title="" onclick=" openInNewBrowser && openInNewBrowser(event.target.href);"></a></p>';
            expect(utils_1.Utils.htmlFromMarkdown('[]("xss-attack="true"other="whatever)')).toBe(expectedHtml);
            window.openInNewBrowser = null;
        });
    });
    describe('countCheckboxesInMarkdown', function () {
        test('should count checkboxes', function () {
            var text = "\n                ## Header\n                - [x] one\n                - [ ] two\n                - [x] three\n            ".replace(/\n\s+/gm, '\n');
            var checkboxes = utils_1.Utils.countCheckboxesInMarkdown(text);
            expect(checkboxes.total).toBe(3);
            expect(checkboxes.checked).toBe(2);
        });
    });
    describe('test - buildURL', function () {
        test('buildURL, no base', function () {
            expect(utils_1.Utils.buildURL('test', true)).toBe('http://localhost/test');
            expect(utils_1.Utils.buildURL('/test', true)).toBe('http://localhost/test');
            expect(utils_1.Utils.buildURL('test')).toBe('/test');
            expect(utils_1.Utils.buildURL('/test')).toBe('/test');
        });
        test('buildURL, base no slash', function () {
            window.baseURL = 'base';
            expect(utils_1.Utils.buildURL('test', true)).toBe('http://localhost/base/test');
            expect(utils_1.Utils.buildURL('/test', true)).toBe('http://localhost/base/test');
            expect(utils_1.Utils.buildURL('test')).toBe('base/test');
            expect(utils_1.Utils.buildURL('/test')).toBe('base/test');
        });
        test('buildUrl, base with slash', function () {
            window.baseURL = '/base/';
            expect(utils_1.Utils.buildURL('test', true)).toBe('http://localhost/base/test');
            expect(utils_1.Utils.buildURL('/test', true)).toBe('http://localhost/base/test');
            expect(utils_1.Utils.buildURL('test')).toBe('base/test');
            expect(utils_1.Utils.buildURL('/test')).toBe('base/test');
        });
    });
    describe('display date', function () {
        var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
        it('should show month and day for current year', function () {
            var currentYear = new Date().getFullYear();
            var date = new Date(currentYear, 6, 9);
            expect(utils_1.Utils.displayDate(date, intl)).toBe('July 09');
        });
        it('should show month, day and year for previous year', function () {
            var currentYear = new Date().getFullYear();
            var previousYear = currentYear - 1;
            var date = new Date(previousYear, 6, 9);
            expect(utils_1.Utils.displayDate(date, intl)).toBe("July 09, ".concat(previousYear));
        });
    });
    describe('input date', function () {
        var currentYear = new Date().getFullYear();
        var date = new Date(currentYear, 6, 9);
        it('should show mm/dd/yyyy for current year', function () {
            var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
            expect(utils_1.Utils.inputDate(date, intl)).toBe("07/09/".concat(currentYear));
        });
        it('should show dd/mm/yyyy for current year, es local', function () {
            var intl = (0, react_intl_1.createIntl)({ locale: 'es-es' });
            expect(utils_1.Utils.inputDate(date, intl)).toBe("09/07/".concat(currentYear));
        });
    });
    describe('display date and time', function () {
        var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
        it('should show month, day and time for current year', function () {
            var currentYear = new Date().getFullYear();
            var date = new Date(currentYear, 6, 9, 15, 20);
            expect(utils_1.Utils.displayDateTime(date, intl)).toBe('July 09, 3:20 PM');
        });
        it('should show month, day, year and time for previous year', function () {
            var currentYear = new Date().getFullYear();
            var previousYear = currentYear - 1;
            var date = new Date(previousYear, 6, 9, 5, 35);
            expect(utils_1.Utils.displayDateTime(date, intl)).toBe("July 09, ".concat(previousYear, ", 5:35 AM"));
        });
    });
    describe('compare versions', function () {
        it('should return one if b > a', function () {
            expect(utils_1.Utils.compareVersions('0.9.4', '0.10.0')).toBe(1);
        });
        it('should return zero if a = b', function () {
            expect(utils_1.Utils.compareVersions('1.2.3', '1.2.3')).toBe(0);
        });
        it('should return minus one if b < a', function () {
            expect(utils_1.Utils.compareVersions('10.9.4', '10.9.2')).toBe(-1);
        });
    });
});
