"use strict";
exports.__esModule = true;
var luxon_1 = require("luxon");
var utils_1 = require("../../utils");
var constants_1 = require("../../constants");
var ROUNDED_DECIMAL_PLACES = 2;
function getCardProperty(card, property) {
    if (property.id === constants_1.Constants.titleColumnId) {
        return card.title;
    }
    switch (property.type) {
        case ('createdBy'): {
            return card.createdBy;
        }
        case ('createdTime'): {
            return fixTimestampToMinutesAccuracy(card.createdAt);
        }
        case ('updatedBy'): {
            return card.updatedBy;
        }
        case ('updatedTime'): {
            return fixTimestampToMinutesAccuracy(card.updatedAt);
        }
        default: {
            return card.fields.properties[property.id];
        }
    }
}
function fixTimestampToMinutesAccuracy(timestamp) {
    // For timestamps that are formatted as hour/minute strings on the UI, we throw away the (milli)seconds
    // so that things like counting unique values work intuitively
    return timestamp - (timestamp % 60000);
}
function cardsWithValue(cards, property) {
    return cards
        .filter(function (card) { return Boolean(getCardProperty(card, property)); });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function count(cards, property) {
    return String(cards.length);
}
function countEmpty(cards, property) {
    return String(cards.length - cardsWithValue(cards, property).length);
}
// return count of card which have this property value as not null \\ undefined \\ ''
function countNotEmpty(cards, property) {
    return String(cardsWithValue(cards, property).length);
}
function percentEmpty(cards, property) {
    if (cards.length === 0) {
        return '';
    }
    return "".concat(String((((cards.length - cardsWithValue(cards, property).length) / cards.length) * 100).toFixed(0)), "%");
}
function percentNotEmpty(cards, property) {
    if (cards.length === 0) {
        return '';
    }
    return "".concat(String(((cardsWithValue(cards, property).length / cards.length) * 100).toFixed(0)), "%");
}
function countValueHelper(cards, property) {
    var values = 0;
    if (property.type === 'multiSelect') {
        cardsWithValue(cards, property)
            .forEach(function (card) {
            values += getCardProperty(card, property).length;
        });
    }
    else {
        values = cardsWithValue(cards, property).length;
    }
    return values;
}
function countValue(cards, property) {
    return String(countValueHelper(cards, property));
}
function countChecked(cards, property) {
    return countValue(cards, property);
}
function countUnchecked(cards, property) {
    return String(cards.length - countValueHelper(cards, property));
}
function percentChecked(cards, property) {
    var total = cards.length;
    var checked = countValueHelper(cards, property);
    return "".concat(String(Math.round((checked * 100) / total)), "%");
}
function percentUnchecked(cards, property) {
    var total = cards.length;
    var checked = countValueHelper(cards, property);
    return "".concat(String(Math.round(((total - checked) * 100) / total)), "%");
}
function countUniqueValue(cards, property) {
    var valueMap = new Map();
    cards.forEach(function (card) {
        var value = getCardProperty(card, property);
        if (!value) {
            return;
        }
        if (property.type === 'multiSelect') {
            value.forEach(function (v) { return valueMap.set(v, true); });
        }
        else {
            valueMap.set(String(value), true);
        }
    });
    return String(valueMap.size);
}
function sum(cards, property) {
    var result = 0;
    cardsWithValue(cards, property)
        .forEach(function (card) {
        result += parseFloat(getCardProperty(card, property));
    });
    return String(utils_1.Utils.roundTo(result, ROUNDED_DECIMAL_PLACES));
}
function average(cards, property) {
    var numCards = cardsWithValue(cards, property).length;
    if (numCards === 0) {
        return '0';
    }
    var result = parseFloat(sum(cards, property));
    var avg = result / numCards;
    return String(utils_1.Utils.roundTo(avg, ROUNDED_DECIMAL_PLACES));
}
function median(cards, property) {
    var sorted = cardsWithValue(cards, property)
        .sort(function (a, b) {
        if (!getCardProperty(a, property)) {
            return 1;
        }
        if (!getCardProperty(b, property)) {
            return -1;
        }
        var aValue = parseFloat(getCardProperty(a, property) || '0');
        var bValue = parseFloat(getCardProperty(b, property) || '0');
        return aValue - bValue;
    });
    if (sorted.length === 0) {
        return '0';
    }
    var result;
    if (sorted.length % 2 === 0) {
        var val1 = parseFloat(getCardProperty(sorted[sorted.length / 2], property));
        var val2 = parseFloat(getCardProperty(sorted[(sorted.length / 2) - 1], property));
        result = (val1 + val2) / 2;
    }
    else {
        result = parseFloat(getCardProperty(sorted[Math.floor(sorted.length / 2)], property));
    }
    return String(utils_1.Utils.roundTo(result, ROUNDED_DECIMAL_PLACES));
}
function min(cards, property) {
    var result = Number.POSITIVE_INFINITY;
    cards.forEach(function (card) {
        if (!getCardProperty(card, property)) {
            return;
        }
        var value = parseFloat(getCardProperty(card, property));
        result = Math.min(result, value);
    });
    return String(result === Number.POSITIVE_INFINITY ? '0' : String(utils_1.Utils.roundTo(result, ROUNDED_DECIMAL_PLACES)));
}
function max(cards, property) {
    var result = Number.NEGATIVE_INFINITY;
    cards.forEach(function (card) {
        if (!getCardProperty(card, property)) {
            return;
        }
        var value = parseFloat(getCardProperty(card, property));
        result = Math.max(result, value);
    });
    return String(result === Number.NEGATIVE_INFINITY ? '0' : String(utils_1.Utils.roundTo(result, ROUNDED_DECIMAL_PLACES)));
}
function range(cards, property) {
    return "".concat(min(cards, property), " - ").concat(max(cards, property));
}
function earliest(cards, property, intl) {
    var result = earliestEpoch(cards, property);
    if (result === Number.POSITIVE_INFINITY) {
        return '';
    }
    var date = new Date(result);
    return property.type === 'date' ? utils_1.Utils.displayDate(date, intl) : utils_1.Utils.displayDateTime(date, intl);
}
function earliestEpoch(cards, property) {
    var result = Number.POSITIVE_INFINITY;
    cards.forEach(function (card) {
        var timestamps = getTimestampsFromPropertyValue(getCardProperty(card, property));
        for (var _i = 0, timestamps_1 = timestamps; _i < timestamps_1.length; _i++) {
            var timestamp = timestamps_1[_i];
            result = Math.min(result, timestamp);
        }
    });
    return result;
}
function latest(cards, property, intl) {
    var result = latestEpoch(cards, property);
    if (result === Number.NEGATIVE_INFINITY) {
        return '';
    }
    var date = new Date(result);
    return property.type === 'date' ? utils_1.Utils.displayDate(date, intl) : utils_1.Utils.displayDateTime(date, intl);
}
function latestEpoch(cards, property) {
    var result = Number.NEGATIVE_INFINITY;
    cards.forEach(function (card) {
        var timestamps = getTimestampsFromPropertyValue(getCardProperty(card, property));
        for (var _i = 0, timestamps_2 = timestamps; _i < timestamps_2.length; _i++) {
            var timestamp = timestamps_2[_i];
            result = Math.max(result, timestamp);
        }
    });
    return result;
}
function getTimestampsFromPropertyValue(value) {
    if (typeof value === 'number') {
        return [value];
    }
    if (typeof value === 'string') {
        var property = void 0;
        try {
            property = JSON.parse(value);
        }
        catch (_a) {
            return [];
        }
        return [property.from, property.to].flatMap(function (e) {
            return e ? [e] : [];
        });
    }
    return [];
}
function dateRange(cards, property, intl) {
    var resultEarliest = earliestEpoch(cards, property);
    if (resultEarliest === Number.POSITIVE_INFINITY) {
        return '';
    }
    var resultLatest = latestEpoch(cards, property);
    if (resultLatest === Number.NEGATIVE_INFINITY) {
        return '';
    }
    return luxon_1.Duration.fromMillis(resultLatest - resultEarliest).toHuman();
}
var Calculations = {
    count: count,
    countEmpty: countEmpty,
    countNotEmpty: countNotEmpty,
    percentEmpty: percentEmpty,
    percentNotEmpty: percentNotEmpty,
    countValue: countValue,
    countUniqueValue: countUniqueValue,
    countChecked: countChecked,
    countUnchecked: countUnchecked,
    percentChecked: percentChecked,
    percentUnchecked: percentUnchecked,
    sum: sum,
    average: average,
    median: median,
    min: min,
    max: max,
    range: range,
    earliest: earliest,
    latest: latest,
    dateRange: dateRange
};
exports["default"] = Calculations;
