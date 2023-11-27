const express = require('express');
const router = express.Router();
const { find, findOne } = require('lib/mongo');

const mongoose = require('mongoose');
require('models/Recipe');
const Recipe = mongoose.model('recipes');

router.get("/", (req, res) => {
	res.send("Root of API");
});

router.get("/recipes/all", async (req, res) => {
	res.json(await find(Recipe, {}));
});

router.get("/recipes/by-name/:name", async (req, res) => {
	res.json(await findOne(Recipe, { name: req.params.name }));
});

module.exports = router;