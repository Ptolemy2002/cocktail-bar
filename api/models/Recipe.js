const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	image: String,
	glass: String,
	ingredients: [
		{
			unit: String,
			amount: Number,
			ingredient: String
		}
	],
	garnish: String,
	preparation: String
});

module.exports = mongoose.model('recipes', RecipeSchema);