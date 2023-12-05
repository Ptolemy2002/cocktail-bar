const mongoose = require('mongoose');
const { errorResponse } = require('lib/misc');

require('models/Recipe');
const Recipe = mongoose.model('recipes');

function keyType(collection, key) {
    if (key === "_id") return mongoose.Types.ObjectId;
    return collection.schema.path(key).instance;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

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

function transformQueryCaseInsensitive(collection, query) {
    for (let key in query) {
        if (key === "_id") continue;
        if (keyType(collection, key) !== "String") continue;
        
        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(value, "i");
        }
    }

    return query;
}

function transformQueryAccentInsensitive(collection, query) {
    for (let key in query) {
        if (key === "_id") continue;
        if (keyType(collection, key) !== "String") continue;

        let value = query[key];
        if (typeof value === "string") {
            query[key] = new RegExp(accentInsensitive(value), "i");
        } else if (value instanceof RegExp) {
            query[key] = new RegExp(accentInsensitive(value.source), value.flags);
        }
    }

    return query;
}

function transformQueryMatchWhole(collection, query) {
    for (let key in query) {
        if (key === "_id") continue;
        if (keyType(collection, key) !== "String") continue;

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
            query = transformQueryCaseInsensitive(collection, query);
        }

        if (args.matchWhole) {
            query = transformQueryMatchWhole(collection, query);
        }

        if (!args.accentSensitive) {
            query = transformQueryAccentInsensitive(collection, query);
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
    return (collection, key, value, caseInsensitive=false, accentSensitive=false) => {
        const query = {};
        query[key] = value;
        
        return fun(collection, query, { caseInsensitive, accentSensitive, matchWhole: true });
    };
}

function whereContains(fun) {
    return (collection, key, value, caseInsensitive=false, accentSensitive=false) => {
        const query = {};
        query[key] = value;
        
        return fun(collection, query, { caseInsensitive, accentSensitive, matchWhole: false });
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

function updateFunction(fun) {
    return async (collection, query={}, update={}, args={}) => {
        if (args.caseInsensitive) {
            query = transformQueryCaseInsensitive(collection, query);
        }

        if (args.matchWhole) {
            query = transformQueryMatchWhole(collection, query);
        }

        if (!args.accentSensitive) {
            query = transformQueryAccentInsensitive(collection, query);
        }

        // Verify that each id is a valid ObjectId
        Object.keys(query).forEach((key) => {
            if (key === "_id" && !mongoose.isValidObjectId(query[key])) {
                const err = new TypeError(`Invalid ObjectId: ${query[key]}`);
                err.status = 400;
                throw err;
            }
        });

        // If the update has an _id, remove it
        if (update.hasOwnProperty("_id")) {
            delete update._id;
        }

        return await collection[fun](query, {$set: update});
    }
}

function updateWhereEqual(fun) {
    return (collection, key, value, update, caseInsensitive=false, accentSensitive=false) => {
        const query = {};
        query[key] = value;

        return fun(collection, query, update, { caseInsensitive, accentSensitive, matchWhole: true });
    }
}

function updateWhereContains(fun) {
    return (collection, key, value, update, caseInsensitive=false, accentSensitive=false) => {
        const query = {};
        query[key] = value;

        return fun(collection, query, update, { caseInsensitive, accentSensitive, matchWhole: false });
    }
}

const updateOne = updateFunction("updateOne");
const updateMany = updateFunction("updateMany");
const updateOneWhereEqual = updateWhereEqual(updateOne);
const updateOneWhereContains = updateWhereContains(updateOne);
const updateManyWhereEqual = updateWhereEqual(updateMany);
const updateManyWhereContains = updateWhereContains(updateMany);

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

async function createRecipe(recipeData) {
    recipeData._id = new mongoose.Types.ObjectId();
    recipeData.isNew = true;
    return await Recipe.create(recipeData);
}

function deleteFunction(fun) {
    return async (collection, query={}, args={}) => {
        if (args.caseInsensitive) {
            query = transformQueryCaseInsensitive(collection, query);
        }

        if (args.matchWhole) {
            query = transformQueryMatchWhole(collection, query);
        }

        if (!args.accentSensitive) {
            query = transformQueryAccentInsensitive(collection, query);
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

const deleteOne = deleteFunction("deleteOne");
const deleteMany = deleteFunction("deleteMany");
const deleteOneWhereEqual = whereEqual(deleteOne);
const deleteOneWhereContains = whereContains(deleteOne);
const deleteManyWhereEqual = whereEqual(deleteMany);
const deleteManyWhereContains = whereContains(deleteMany);

module.exports = {
    "keyType": keyType,
    "escapeRegex": escapeRegex,
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
    "updateOne": tryFunc(updateOne),
    "updateMany": tryFunc(updateMany),
    "updateOneWhereEqual": tryFunc(updateOneWhereEqual),
    "updateOneWhereContains": tryFunc(updateOneWhereContains),
    "updateManyWhereEqual": tryFunc(updateManyWhereEqual),
    "updateManyWhereContains": tryFunc(updateManyWhereContains),
    "createRecipe": tryFunc(createRecipe),
    "deleteOne": tryFunc(deleteOne),
    "deleteMany": tryFunc(deleteMany),
    "deleteOneWhereEqual": tryFunc(deleteOneWhereEqual),
    "deleteOneWhereContains": tryFunc(deleteOneWhereContains),
    "deleteManyWhereEqual": tryFunc(deleteManyWhereEqual),
    "deleteManyWhereContains": tryFunc(deleteManyWhereContains),
    
    Recipe
};