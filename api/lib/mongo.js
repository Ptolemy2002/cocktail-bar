const mongoose = require('mongoose');
const { errorResponse } = require('lib/misc');

require('models/Recipe');
const Recipe = mongoose.model('recipes');

function accentInsensitive(string = '') {   
    const accentPatterns = [
        "(a|á|à|ä|â)", "(A|Á|À|Ä|Â)",
        "(e|é|è|ë|ê)", "(E|É|È|Ë|Ê)",
        "(i|í|ì|ï|î)", "(I|Í|Ì|Ï|Î)",
        "(o|ó|ò|ö|ô)", "(O|Ó|Ò|Ö|Ô)",
        "(u|ú|ù|ü|û)", "(U|Ú|Ù|Ü|Û)"
    ]
    
    accentPatterns.forEach((pattern) => {
        string = string.replaceAll(new RegExp(pattern, "g"), pattern);
    });

    return string;
}

function transformQueryCaseInsensitive(query) {
    for (let key in query) {
        if (key === "_id") continue;
        
        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(value, "i");
        }
    }

    return query;
}

function transformQueryAccentInsensitive(query) {
    for (let key in query) {
        if (key === "_id") continue;

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
        if (key === "_id") continue;

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
	return async (collection, query={}, args={}) => {
        if (args.caseInsensitive) {
            query = transformQueryCaseInsensitive(query);
        }

        if (args.matchWhole) {
            query = transformQueryMatchWhole(query);
        }

        if (!args.accentSensitive) {
            query = transformQueryAccentInsensitive(query);
        }

        // Verify that each id is a valid ObjectId
        Object.keys(query).forEach((key) => {
            if (key === "_id" && !mongoose.isValidObjectId(query[key])) {
                const err = new TypeError(`Invalid ObjectId: ${query[key]}`);
                err.status = 400;
                throw err;
            }
        });

        return await collection[fun](query);
    }
}

const findAll = findFunction("find");
const findOne = findFunction("findOne");
const countAll = findFunction("countDocuments");

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

const findWhereEqual = whereEqual(findAll);
const findWhereContains = whereContains(findAll);
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
            console.error(err);
            return errorResponse(err, err.status);
        }
    }
}

module.exports = {
    "accentInsensitive": accentInsensitive,
    "transformQueryCaseInsensitive": tryFunc(transformQueryCaseInsensitive),
    "transformQueryAccentInsensitive": tryFunc(transformQueryAccentInsensitive),
    "transformQueryMatchWhole": tryFunc(transformQueryMatchWhole),
    "findAll": tryFunc(findAll),
    "findOne": tryFunc(findOne),
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