const mongoose = require('mongoose');
const { errorResponse } = require('lib/misc');

require('models/Recipe');
const Recipe = mongoose.model('recipes');

function transformQueryCaseInsensitive(query) {
    for (let key in query) {
        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(value, "i");
        }
    }

    return query;
}

function transformQueryMatchWhole(query) {
    for (let key in query) {
        let value = query[key];
        if (value instanceof RegExp) {
            query[key] = new RegExp("^" + value.source + "$", value.flags);
        }
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

        return await collection[fun](query);
    }
}

const find = findFunction("find");
const findOne = findFunction("findOne");

function findAll(collection) {
    return find(collection, {});
}

function findWhereEqual(collection, key, value, caseInsensitive=false) {
    const query = {};
    query[key] = value;
    
    return find(collection, query, { caseInsensitive, matchWhole: true });
}

function findWhereContains(collection, key, value, caseInsensitive=false) {
    const query = {};
    query[key] = value;
    
    return find(collection, query, { caseInsensitive, matchWhole: false });
}

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
    "transformQueryCaseInsensitive": tryFunc(transformQueryCaseInsensitive),
    "transformQueryMatchWhole": tryFunc(transformQueryMatchWhole),
    "find": tryFunc(find),
    "findOne": tryFunc(findOne),
    "findAll": tryFunc(findAll),
    "findWhereEqual": tryFunc(findWhereEqual),
    "findWhereContains": tryFunc(findWhereContains),
    "listDistinct": tryFunc(listDistinct),
    "list": tryFunc(list),
    
    Recipe
};