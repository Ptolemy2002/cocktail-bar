const express = require('express');
const router = express.Router();
const { findAll, findWhereEqual, findWhereContains, countAll, countWhereEqual, countWhereContains, Recipe } = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');

function extractKey(res, key, docs, distinct=false) {
	console.log(docs);
	if (docs._isError) sendResponse(res, docs);

	switch (key) {
		case "_id":
		case "name":
		case "category":
		case "glass": {
			const result = docs.map(doc => doc[key]);
			if (distinct) {
				return [...new Set(result)];
			}

			return result;
		}
		case "ingredient": {
			// Get ingredients from all recipes, flatten the array, remove nulls, and return the result
			let result = docs.map(doc => doc.ingredients.map(ingredient => ingredient.ingredient)).flat().filter(ingredient => !!ingredient);

			if (distinct) {
				return [...new Set(result)];
			}

			return result;
		}
		default: {
			sendResponse(res, errorResponse(new SyntaxError("Invalid property name")), { errorStatus: 400 });
		}
	}
}

router.get("/", (req, res) => {
	res.send("Root of API");
});

router.get("/recipes/all", async (req, res) => {
	const result = await findAll(Recipe);
	sendResponse(res, result);
});

router.get("/recipes/all/count", async (req, res) => {
	const result = await countAll(Recipe);
	sendResponse(res, result);
});

router.get("/recipes/all/list-:prop", async (req, res) => {
	const docs = await findAll(Recipe);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/all/list-:prop/distinct", async (req, res) => {
	const docs = await findAll(Recipe);
	const result = extractKey(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const result = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const docs = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop/distinct", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const docs = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/count", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const result = await countWhereEqual(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const result = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/list-:prop", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const docs = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result); 
});

router.get("/recipes/:key-contains/:value/list-:prop/distinct", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const docs = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/count", async (req, res) => {
	if (req.params.key === "ingredient") req.params.key = "ingredients.ingredient";
	const result = await countWhereContains(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

module.exports = router;