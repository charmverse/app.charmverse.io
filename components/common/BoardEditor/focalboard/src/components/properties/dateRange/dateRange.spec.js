"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_intl_1 = require("react-intl");
require("@testing-library/jest-dom");
var testUtils_1 = require("../../../testUtils");
var dateRange_1 = require("./dateRange");
// create Dates for specific days for this year.
var June15 = new Date(Date.UTC(new Date().getFullYear(), 5, 15, 12));
var June15Local = new Date(new Date().getFullYear(), 5, 15, 12);
var June20 = new Date(Date.UTC(new Date().getFullYear(), 5, 20, 12));
describe('components/properties/dateRange', function () {
    beforeEach(function () {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn();
        document.execCommand = jest.fn();
    });
    test('returns default correctly', function () {
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value='' onChange={jest.fn()}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('returns local correctly - es local', function () {
        var component = (<react_intl_1.IntlProvider locale='es'>
        <dateRange_1["default"] className='octo-propertyvalue' value={June15Local.getTime().toString()} onChange={jest.fn()}/>
      </react_intl_1.IntlProvider>);
        var _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText;
        var input = getByText('15 de junio');
        expect(input).not.toBeNull();
        expect(container).toMatchSnapshot();
    });
    test('handles calendar click event', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value='' showEmptyPlaceholder={true} onChange={callback}/>);
        var date = new Date();
        var fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12);
        var _a = (0, react_2.render)(component), getByText = _a.getByText, getByTitle = _a.getByTitle;
        var dayDisplay = getByText('Empty');
        user_event_1["default"].click(dayDisplay);
        var day = getByText('15');
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(day);
        user_event_1["default"].click(modal);
        var rObject = { from: fifteenth };
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject));
    });
    test('handles setting range', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value='' showEmptyPlaceholder={true} onChange={callback}/>);
        // open modal
        var _a = (0, react_2.render)(component), getByText = _a.getByText, getByTitle = _a.getByTitle;
        var dayDisplay = getByText('Empty');
        user_event_1["default"].click(dayDisplay);
        // select start date
        var date = new Date();
        var fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12);
        var start = getByText('15');
        user_event_1["default"].click(start);
        // create range
        var endDate = getByText('End date');
        user_event_1["default"].click(endDate);
        var twentieth = Date.UTC(date.getFullYear(), date.getMonth(), 20, 12);
        var end = getByText('20');
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(end);
        user_event_1["default"].click(modal);
        var rObject = { from: fifteenth, to: twentieth };
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject));
    });
    test('handle clear', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value={June15Local.getTime().toString()} onChange={callback}/>);
        var _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText, getByTitle = _a.getByTitle;
        expect(container).toMatchSnapshot();
        // open modal
        var dayDisplay = getByText('June 15');
        user_event_1["default"].click(dayDisplay);
        var clear = getByText('Clear');
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(clear);
        user_event_1["default"].click(modal);
        expect(callback).toHaveBeenCalledWith('');
    });
    test('set via text input', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value={"{\"from\": ".concat(June15.getTime().toString(), ",\"to\": ").concat(June20.getTime().toString(), "}")} onChange={callback}/>);
        var _a = (0, react_2.render)(component), container = _a.container, getByRole = _a.getByRole, getByTitle = _a.getByTitle, getByDisplayValue = _a.getByDisplayValue;
        expect(container).toMatchSnapshot();
        // open modal
        var dayDisplay = getByRole('button', { name: 'June 15 → June 20' });
        user_event_1["default"].click(dayDisplay);
        var fromInput = getByDisplayValue('June 15');
        var toInput = getByDisplayValue('June 20');
        user_event_1["default"].type(fromInput, '{selectall}{delay}07/15/2021{enter}');
        user_event_1["default"].type(toInput, '{selectall}{delay}07/20/2021{enter}');
        var July15 = new Date(Date.UTC(2021, 6, 15, 12));
        var July20 = new Date(Date.UTC(2021, 6, 20, 12));
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(modal);
        // {from: '2021-07-15', to: '2021-07-20'}
        var retVal = "{\"from\":".concat(July15.getTime().toString(), ",\"to\":").concat(July20.getTime().toString(), "}");
        expect(callback).toHaveBeenCalledWith(retVal);
    });
    test('set via text input, es locale', function () {
        var callback = jest.fn();
        var component = (<react_intl_1.IntlProvider locale='es'>
        <dateRange_1["default"] className='octo-propertyvalue' value={"{\"from\": ".concat(June15.getTime().toString(), ",\"to\": ").concat(June20.getTime().toString(), "}")} onChange={callback}/>
      </react_intl_1.IntlProvider>);
        var _a = (0, react_2.render)(component), container = _a.container, getByRole = _a.getByRole, getByTitle = _a.getByTitle, getByDisplayValue = _a.getByDisplayValue;
        expect(container).toMatchSnapshot();
        // open modal
        var dayDisplay = getByRole('button', { name: '15 de junio → 20 de junio' });
        user_event_1["default"].click(dayDisplay);
        var fromInput = getByDisplayValue('15 de junio');
        var toInput = getByDisplayValue('20 de junio');
        user_event_1["default"].type(fromInput, '{selectall}15/07/2021{enter}');
        user_event_1["default"].type(toInput, '{selectall}20/07/2021{enter}');
        var July15 = new Date(Date.UTC(2021, 6, 15, 12));
        var July20 = new Date(Date.UTC(2021, 6, 20, 12));
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(modal);
        // {from: '2021-07-15', to: '2021-07-20'}
        var retVal = "{\"from\":".concat(July15.getTime().toString(), ",\"to\":").concat(July20.getTime().toString(), "}");
        expect(callback).toHaveBeenCalledWith(retVal);
    });
    test('cancel set via text input', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value={"{\"from\": ".concat(June15.getTime().toString(), ",\"to\": ").concat(June20.getTime().toString(), "}")} onChange={callback}/>);
        var _a = (0, react_2.render)(component), container = _a.container, getByRole = _a.getByRole, getByTitle = _a.getByTitle, getByDisplayValue = _a.getByDisplayValue;
        expect(container).toMatchSnapshot();
        // open modal
        var dayDisplay = getByRole('button', { name: 'June 15 → June 20' });
        user_event_1["default"].click(dayDisplay);
        var fromInput = getByDisplayValue('June 15');
        var toInput = getByDisplayValue('June 20');
        user_event_1["default"].type(fromInput, '{selectall}07/15/2021{delay}{esc}');
        user_event_1["default"].type(toInput, '{selectall}07/20/2021{delay}{esc}');
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(modal);
        // const retVal = {from: '2021-06-15', to: '2021-06-20'}
        var retVal = "{\"from\":".concat(June15.getTime().toString(), ",\"to\":").concat(June20.getTime().toString(), "}");
        expect(callback).toHaveBeenCalledWith(retVal);
    });
    test('handles `Today` button click event', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<dateRange_1["default"] className='octo-propertyvalue' value='' showEmptyPlaceholder={true} onChange={callback}/>);
        // To see if 'Today' button correctly selects today's date,
        // we can check it against `new Date()`.
        // About `Date()`
        // > "When called as a function, returns a string representation of the current date and time"
        var date = new Date();
        var today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        var _a = (0, react_2.render)(component), getByText = _a.getByText, getByTitle = _a.getByTitle;
        var dayDisplay = getByText('Empty');
        user_event_1["default"].click(dayDisplay);
        var day = getByText('Today');
        var modal = getByTitle('Close').children[0];
        user_event_1["default"].click(day);
        user_event_1["default"].click(modal);
        var rObject = { from: today };
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject));
    });
});
