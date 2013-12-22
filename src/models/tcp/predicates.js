'use strict';

function getCaseInsensitive (obj, fieldName) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        if (fieldName.toLowerCase() === keys[i].toLowerCase()) {
            return obj[keys[i]];
        }
    }
    return undefined;
}

function getNested (obj, fieldName) {
    var result = obj,
        fields = fieldName.split('.');

    fields.forEach(function (field) {
        var next = getCaseInsensitive(result, field);
        result = next ? next : undefined;
    });
    return result;
}

function satisfies (fieldName, expected, request, predicate) {
    var actual = getNested(request, fieldName);
    if (['string', 'boolean'].indexOf(typeof expected) >= 0) {
        return predicate(actual, expected);
    }
    else {
        return false;
    }
}

function create (predicate) {
    return function (fieldName, expected, request) {
        return satisfies(fieldName, expected, request, predicate);
    };
}

module.exports = {
    is: create(function (actual, expected) { return actual && actual.toLowerCase() === expected.toLowerCase(); }),
    contains: create(function (actual, expected) { return actual && actual.toLowerCase().indexOf(expected.toLowerCase()) >= 0; }),
    startsWith: create(function (actual, expected) { return actual && actual.toLowerCase().indexOf(expected.toLowerCase()) === 0; }),
    endsWith: create(function (actual, expected) { return actual && actual.toLowerCase().indexOf(expected.toLowerCase(), actual.length - expected.length) >= 0; }),
    matches: create(function (actual, expected) { return new RegExp(expected).test(actual); }),
    exists: create(function (actual, expected) { return expected ? actual && actual.length > 0 : !actual || actual.length === 0; }),
    not: function (fieldName, expected, request) {
        return !Object.keys(expected).some(function (predicate) {
            return module.exports[predicate](fieldName, expected[predicate], request);
        });
    },
    inject: function (fieldName, predicate, request) {
        /* jshint evil: true, unused: false */
        var arg = fieldName === 'request' ? request : request[fieldName],
            scope = JSON.parse(JSON.stringify(arg)), // prevent state-changing operations
            injected = '(' + predicate + ')(scope);';
        return eval(injected);
    }
};