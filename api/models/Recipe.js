const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true
	},
	image: String,
	category: String,
	glass: String,
	ingredients: [
		{
			unit: String,
			amount: Number,
			ingredient: String,
			label: String,
			special: String
		}
	],
	garnish: String,
	preparation: String
});

// Create the Index
RecipeSchema.index({
	name: 'default',
	definition: {
		mappings: {
			dynamic: true
		}
	}
});

module.exports = mongoose.model('recipes', RecipeSchema);