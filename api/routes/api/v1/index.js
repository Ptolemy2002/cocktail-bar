const express = require('express');
const router = express.Router();
const { findAll, findWhereEqual, findWhereContains, countAll, countWhereEqual, countWhereContains, updateOne, Recipe } = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');

function convertKey(key) {
	switch (key) {
		case "id": return "_id";
		case "ingredient": return "ingredients.ingredient";
		case "unit": return "ingredients.unit";
		case "amount": return "ingredients.amount";
		case "special": return "ingredients.special";
		default: return key;
	}
}

function extractProps(res, prop, docs, distinct=false) {
	if (docs._isError) sendResponse(res, docs);

	if (prop === "id") prop = "_id";

	switch (prop) {
		case "_id":
		case "name":
		case "category":
		case "preparation":
		case "garnish":
		case "image":
		case "glass": {
			let result = docs.map(doc => doc[prop]);
			if (distinct) {
				result = [...new Set(result)];
			}

			return result.filter(i => i !== undefined);
		}
		case "unit":
		case "amount":
		case "special":
		case "ingredient": {
			// Get ingredients from all recipes and flatten the array
			let result = docs.map(doc => doc.ingredients.map(ingredient => ingredient[prop])).flat();

			if (distinct) {
				result = [...new Set(result)];
			}

			return result.filter(i => i !== undefined);
		}
		default: {
			sendResponse(res, errorResponse(new SyntaxError(`Invalid property name: ${prop}`)), { errorStatus: 400 });
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
	const result = extractProps(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/all/list-:prop/distinct", async (req, res) => {
	const docs = await findAll(Recipe);
	const result = extractProps(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value", async (req, res) => {
	const result = await findWhereEqual(Recipe, convertKey(req.params.key), req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop", async (req, res) => {
	const docs = await findWhereEqual(Recipe, convertKey(req.params.key), req.params.value, true);
	const result = extractProps(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop/distinct", async (req, res) => {
	const docs = await findWhereEqual(Recipe, convertKey(req.params.key), req.params.value, true);
	const result = extractProps(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/count", async (req, res) => {
	const result = await countWhereEqual(Recipe, convertKey(req.params.key), req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value", async (req, res) => {
	const result = await findWhereContains(Recipe, convertKey(req.params.key), req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/list-:prop", async (req, res) => {
	const docs = await findWhereContains(Recipe, convertKey(req.params.key), req.params.value, true);
	const result = extractProps(res, req.params.prop, docs);
	sendResponse(res, result); 
});

router.get("/recipes/:key-contains/:value/list-:prop/distinct", async (req, res) => {
	const docs = await findWhereContains(Recipe, convertKey(req.params.key), req.params.value, true);
	const result = extractProps(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/count", async (req, res) => {
	const result = await countWhereContains(Recipe, convertKey(req.params.key), req.params.value, true);
	sendResponse(res, result);
});

router.post("/recipes/update/by-name/:name", async (req, res) => {
	const result = await updateOne(Recipe, { name: req.params.name }, {$set: req.body});
	sendResponse(res, result);
});

router.post("/recipes/update/by-id/:id", async (req, res) => {
	const result = await updateOne(Recipe, { _id: req.params.id }, {$set: req.body});
	sendResponse(res, result);
});

module.exports = router;