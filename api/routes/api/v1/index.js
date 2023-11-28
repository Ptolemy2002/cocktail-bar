const express = require('express');
const router = express.Router();
const { findAll, findWhereEqual, findWhereContains, Recipe } = require('lib/mongo');
const { sendResponse, errorResponse } = require('lib/misc');

function extractKey(res, key, docs, distinct=false) {
	switch (key) {
		case "name":
		case "category":
		case "glass": {
			const result = docs.map(doc => doc[key]);
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

router.get("/recipes/all/list-:prop", async (req, res) => {
	const docs = await findAll(Recipe);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value", async (req, res) => {
	const result = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop", async (req, res) => {
	const docs = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result);
});

router.get("/recipes/:key-equals/:value/list-:prop/distinct", async (req, res) => {
	const docs = await findWhereEqual(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value", async (req, res) => {
	const result = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	sendResponse(res, result);
});

router.get("/recipes/:key-contains/:value/list-:prop", async (req, res) => {
	const docs = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs);
	sendResponse(res, result); 
});

router.get("/recipes/:key-contains/:value/list-:prop/distinct", async (req, res) => {
	const docs = await findWhereContains(Recipe, req.params.key, req.params.value, true);
	const result = extractKey(res, req.params.prop, docs, true);
	sendResponse(res, result);
}); 

module.exports = router;