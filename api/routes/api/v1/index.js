const express = require('express');
const router = express.Router();
const { keyType, escapeRegex, findAll, findWhereEqual, findWhereContains,
		countAll, countWhereEqual, countWhereContains, updateOneWhereEqual, createRecipe,
		deleteOneWhereEqual, search, Recipe } = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');

function convertKey(key) {
	switch (key) {
		case "id": return "_id";
		case "ingredient": return "ingredients.ingredient";
		case "unit": return "ingredients.unit";
		case "amount": return "ingredients.amount";
		case "special": return "ingredients.special";
		case "label": return "ingredients.label";
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
	const key = convertKey(req.params.key);
	let result;
	if (keyType(Recipe, key) === "String") {
		result = await findWhereEqual(Recipe, key, escapeRegex(req.params.value), true);
	} else {
		result = await findWhereEqual(Recipe, key, req.params.value, true);
	}
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop", async (req, res) => {
	const key = convertKey(req.params.key);
	let docs;
	if (keyType(Recipe, key) === "String") {
		docs = await findWhereEqual(Recipe, key, escapeRegex(req.params.value), true);
	} else {
		docs = await findWhereEqual(Recipe, key, req.params.value, true);
	}
	const result = extractProps(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop/distinct", async (req, res) => {
	const key = convertKey(req.params.key);
	let docs;
	if (keyType(Recipe, key) === "String") {
		docs = await findWhereEqual(Recipe, key, escapeRegex(req.params.value), true);
	} else {
		docs = await findWhereEqual(Recipe, key, req.params.value, true);
	}
	const result = extractProps(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/count", async (req, res) => {
	const key = convertKey(req.params.key);
	let result;
	if (keyType(Recipe, key) === "String") {
		result = await countWhereEqual(Recipe, key, escapeRegex(req.params.value), true);
	} else {
		result = await countWhereEqual(Recipe, key, req.params.value, true);
	}
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value", async (req, res) => {
	const key = convertKey(req.params.key);
	if (keyType(Recipe, key) !== "String") {
		sendResponse(res, errorResponse(new TypeError(
			"Key type is not String. A contains query can only be performed on String keys."
		)), { errorStatus: 400 });
		return;
	}
	const result = await findWhereContains(Recipe, key, escapeRegex(req.params.value), true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/list-:prop", async (req, res) => {
	const key = convertKey(req.params.key);
	if (keyType(Recipe, key) !== "String") {
		sendResponse(res, errorResponse(new TypeError(
			"Key type is not String. A contains query can only be performed on String keys."
		)), { errorStatus: 400 });
		return;
	}
	const docs = await findWhereContains(Recipe, key, escapeRegex(req.params.value), true);
	const result = extractProps(res, req.params.prop, docs);
	sendResponse(res, result); 
});

router.get("/recipes/:key-contains/:value/list-:prop/distinct", async (req, res) => {
	const key = convertKey(req.params.key);
	if (keyType(Recipe, key) !== "String") {
		sendResponse(res, errorResponse(new TypeError(
			"Key type is not String. A contains query can only be performed on String keys."
		)), { errorStatus: 400 });
		return;
	}
	const docs = await findWhereContains(Recipe, key, escapeRegex(req.params.value), true);
	const result = extractProps(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/count", async (req, res) => {
	const key = convertKey(req.params.key);
	if (keyType(Recipe, key) !== "String") {
		sendResponse(res, errorResponse(new TypeError(
			"Key type is not String. A contains query can only be performed on String keys."
		)), { errorStatus: 400 });
		return;
	}
	const result = await countWhereContains(Recipe, key, escapeRegex(req.params.value), true);
	sendResponse(res, result);
});

router.post("/recipes/update/by-exact-name/:name", async (req, res) => {
	const result = await updateOneWhereEqual(Recipe, "name", escapeRegex(req.params.name), req.body, false, true);
	sendResponse(res, result);
});

router.post("/recipes/update/by-exact-id/:id", async (req, res) => {
	const result = await updateOneWhereEqual(Recipe, "_id", req.params.id, req.body, false, true);
	sendResponse(res, result);
});

router.post("/recipes/create", async (req, res) => {
	const result = await createRecipe(req.body);
	sendResponse(res, result);
});

router.post("/recipes/duplicate/by-exact-name/:name", async (req, res) => {
	const existingNames = await Recipe.distinct("name");
	
	let newName = req.params.name;
	while (existingNames.includes(newName)) {
		newName += " (Copy)";
	}

	const original = (await findWhereEqual(Recipe, "name", escapeRegex(req.params.name), false, true))[0];
	const newDoc = {
		...original._doc,
		name: newName
	};

	const result = await createRecipe(newDoc);
	sendResponse(res, result);
});

router.post("/recipes/duplicate/by-exact-id/:id", async (req, res) => {
	const existingNames = await Recipe.distinct("name");
	const original = (await findWhereEqual(Recipe, "_id", req.params.id))[0];

	let newName = original.name;
	while (existingNames.includes(newName)) {
		newName += " (Copy)";
	}
	
	const newDoc = {
		...original._doc,
		name: newName
	};

	const result = await createRecipe(newDoc);
	sendResponse(res, result);
});

router.post("/recipes/delete/by-exact-name/:name", async (req, res) => {
	const result = await deleteOneWhereEqual(Recipe, "name", escapeRegex(req.params.name), false, true);
	sendResponse(res, result);
});

router.post("/recipes/delete/by-exact-id/:id", async (req, res) => {
	const result = await deleteOneWhereEqual(Recipe, "_id", req.params.id, false, true);
	sendResponse(res, result);
});

router.get("/recipes/get/by-exact-name/:name", async (req, res) => {
	const result = await findWhereEqual(Recipe, "name", escapeRegex(req.params.name), false, true);
	sendResponse(res, result);
});

router.get("/recipes/get/by-exact-id/:id", async (req, res) => {
	const result = await findWhereEqual(Recipe, "_id", req.params.id, false, true);
	sendResponse(res, result);
});

router.get("/recipes/search/:query", async (req, res) => {
	const result = await search(Recipe, "default", req.params.query);
	sendResponse(res, result);
});

module.exports = router;