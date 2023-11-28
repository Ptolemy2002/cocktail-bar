const mongoose = require('mongoose');

require('models/Recipe');
const Recipe = mongoose.model('recipes');

function errorResponse(err) {
    return {
        _isError: true,
        type: err.name,
        message: err.message
    }
}

function transformQueryCaseInsensitive(query, matchWhole) {
    for (let key in query) {
        let value = query[key];
        if (typeof value === "string") {
            if (matchWhole) {
                if (!value.startsWith("^")) value = "^" + value;
                if (!value.endsWith("$")) value += "$";
            }

            query[key] = new RegExp(value, "i");
        }
    }

    return query;
}

function findFunction(fun) {
	return async (collection, query, args={}) => {
        if (args.caseInsensitive) {
            query = transformQueryCaseInsensitive(query, args.regexMatchWhole);
        }

        return await collection[fun](query);
    }
}

const find = findFunction("find");
const findOne = findFunction("findOne");

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
    "find": tryFunc(find),
    "findOne": tryFunc(findOne),
    "listDistinct": tryFunc(listDistinct),
    "list": tryFunc(list),
    
    Recipe
};