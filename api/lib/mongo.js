const mongoose = require('mongoose');
const { errorResponse } = require('lib/misc');

require('models/Recipe');
const Recipe = mongoose.model('recipes');

function accentInsensitive(string = '') {    
    return string
        .replaceAll(/a/g, '(a|á|à|ä|â)')
        .replaceAll(/A/g, '(A|Á|À|Ä|Â)')
        .replaceAll(/e/g, '(e|é|è|ë|ê)')
        .replaceAll(/E/g, '(E|É|È|Ë|Ê)')
        .replaceAll(/i/g, '(i|í|ì|ï|î)')
        .replaceAll(/I/g, '(I|Í|Ì|Ï|Î)')
        .replaceAll(/o/g, '(o|ó|ò|ö|ô)')
        .replaceAll(/O/g, '(O|Ó|Ò|Ö|Ô)')
        .replaceAll(/u/g, '(u|ú|ù|ü|û)')
        .replaceAll(/U/g, '(U|Ú|Ù|Ü|Û)');
}

function transformQueryCaseInsensitive(query) {
    for (let key in query) {
        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(value, "i");
        }
    }

    return query;
}

function transformQueryAccentInsensitive(query) {
    for (let key in query) {
        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(accentInsensitive(value));
        } else if (value instanceof RegExp) {
            query[key] = new RegExp(accentInsensitive(value.source), value.flags);
        }
    }

    return query;
}

function transformQueryMatchWhole(query) {
    for (let key in query) {
        let value = query[key];
        if (value instanceof RegExp) {
            value = value.source;
        } else if (typeof value === "string") {
            value = value;
        } else {
            continue;
        }

        query[key] = new RegExp("^" + value + "$", "i");
    }

    return query;
}

function findFunction(fun) {
	return async (collection, query, args={}) => {
        if (args.caseInsensitive) {
            query = transformQueryCaseInsensitive(query);
        }

        if (args.matchWhole) {
            query = transformQueryMatchWhole(query);
        }

        if (!args.accentSensitive) {
            query = transformQueryAccentInsensitive(query);
        }

        return await collection[fun](query);
    }
}

const find = findFunction("find");
const findOne = findFunction("findOne");
const countAll = findFunction("countDocuments");

function findAll(collection) {
    return find(collection, {});
}

function whereEqual(fun) {
    return (collection, key, value, caseInsensitive=false) => {
        const query = {};
        query[key] = value;
        
        return fun(collection, query, { caseInsensitive, matchWhole: true });
    };
}

function whereContains(fun) {
    return (collection, key, value, caseInsensitive=false) => {
        const query = {};
        query[key] = value;
        
        return fun(collection, query, { caseInsensitive, matchWhole: false });
    };
}

const findWhereEqual = whereEqual(find);
const findWhereContains = whereContains(find);
const findOneWhereEqual = whereEqual(findOne);
const findOneWhereContains = whereContains(findOne);
const countWhereEqual = whereEqual(countAll);
const countWhereContains = whereContains(countAll);

async function listDistinct(collection, field) {
    const result = await collection.distinct(field);
    return result;
}

async function list(collection, field) {
    const result = await collection.find().select(field);
    return result.map((item) => item[field]);
}

function tryFunc(func) {
    return async (...args) => {
        try {
            return await func(...args);
        } catch (err) {
            return errorResponse(err);
        }
    }
}

module.exports = {
    "accentInsensitive": accentInsensitive,
    "transformQueryCaseInsensitive": tryFunc(transformQueryCaseInsensitive),
    "transformQueryAccentInsensitive": tryFunc(transformQueryAccentInsensitive),
    "transformQueryMatchWhole": tryFunc(transformQueryMatchWhole),
    "find": tryFunc(find),
    "findOne": tryFunc(findOne),
    "findAll": tryFunc(findAll),
    "countAll": tryFunc(countAll),
    "findWhereEqual": tryFunc(findWhereEqual),
    "findWhereContains": tryFunc(findWhereContains),
    "findOneWhereEqual": tryFunc(findOneWhereEqual),
    "findOneWhereContains": tryFunc(findOneWhereContains),
    "countWhereEqual": tryFunc(countWhereEqual),
    "countWhereContains": tryFunc(countWhereContains),
    "listDistinct": tryFunc(listDistinct),
    "list": tryFunc(list),
    
    Recipe
};