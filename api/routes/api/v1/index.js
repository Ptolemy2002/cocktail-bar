const express = require('express');
const router = express.Router();
const { find, listDistinct, Recipe } = require('lib/mongo');

router.get("/", (req, res) => {
	res.send("Root of API");
});

router.get("/recipes/names", async (req, res) => {
	res.json(await listDistinct(Recipe, "name"));
});

router.get("/recipes/categories", async (req, res) => {
	res.json(await listDistinct(Recipe, "category"));
});

router.get("/recipes/glasses", async (req, res) => {
	res.json(await listDistinct(Recipe, "glass"));
});

router.get("/recipes/get/all", async (req, res) => {
	res.json(await find(Recipe, {}));
});

router.get("/recipes/get/:key-equals/:value", async (req, res) => {
	const query = {};
	query[req.params.key] = req.params.value;
	console.log(query);
	res.json(await find(Recipe, query, { caseInsensitive: true, regexMatchWhole: true }));
});

router.get("/recipes/get/:key-contains/:value", async (req, res) => {
	const query = {};
	query[req.params.key] = req.params.value;
	res.json(await find(Recipe, query, { caseInsensitive: true }));
});

module.exports = router;