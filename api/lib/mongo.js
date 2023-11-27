const mongoose = require('mongoose');

async function find(collection, query) {
	const recipes = await collection.find(query);
	return recipes;
}

async function findOne(collection, query) {
    const recipe = await collection.findOne(query);
    return recipe;
}

module.exports = {
    find,
    findOne
};