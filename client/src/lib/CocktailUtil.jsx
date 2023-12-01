import React from "react";
import { useApi } from "src/lib/Api";

class CocktailData {
    id = null;
    _name = "Unknown Cocktail";
    _image = "Shaker.png";
    _category = "Unknown Category";
    _glass = "Unknown Glass";
    _garnish = "None";
    _ingredients = [];
    _preparation = "None";

    previousStates = [];
    _stateIndex = 0;
    _dirty = false;

    get stateIndex() {
        return this._stateIndex;
    }

    set stateIndex(value) {
        if (value >= 0 && value < this.previousStates.length) {
            this._stateIndex = value;
        } else {
            throw new RangeError(`State index ${value} is out of range. Min: 0, Max: ${this.previousStates.length - 1}`);
        }
    }

    get dirty() {
        return this._dirty || this.ingredients.some(ingredient => ingredient.dirty);
    }

    set dirty(value) {
        this._dirty = value;
    }

    queryInProgress = null;
    queryError = null;

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
        this.dirty = true;
    }

    get image() {
        return this._image;
    }

    set image(value) {
        this._image = value;
        this.dirty = true;
    }

    get category() {
        return this._category;
    }

    set category(value) {
        this._category = value;
        this.dirty = true;
    }

    get glass() {
        return this._glass;
    }

    set glass(value) {
        this._glass = value;
        this.dirty = true;
    }

    get garnish() {
        return this._garnish;
    }

    set garnish(value) {
        this._garnish = value;
        this.dirty = true;
    }

    get ingredients() {
        return this._ingredients;
    }

    set ingredients(value) {
        this._ingredients = value;
        this.dirty = true;
    }

    get preparation() {
        return this._preparation;
    }

    set preparation(value) {
        this._preparation = value;
        this.dirty = true;
    }

    static createFromID(id) {
        const result = new CocktailData();
        result.id = id;
        result.checkpoint();
        return result;
    }

    static createFromJSON(cocktailState) {
        const result = new CocktailData();
        result.fromJSON(cocktailState).checkpoint();
        return result;
    }

    toJSON() {
        return {
            _id: this.id,
            name: this.name,
            image: this.image,
            category: this.category,
            glass: this.glass,
            garnish: this.garnish,
            ingredients: this.ingredients.map(ingredient => ingredient.toJSON()),
            preparation: this.preparation
        };
    }

    fromJSON(cocktailState) {
        if (cocktailState.hasOwnProperty("_id")) this.id = cocktailState._id
        if (cocktailState.hasOwnProperty("name")) this.name = cocktailState.name;
        if (cocktailState.hasOwnProperty("image")) this.image = cocktailState.image;
        if (cocktailState.hasOwnProperty("category")) this.category = cocktailState.category;
        if (cocktailState.hasOwnProperty("glass")) this.glass = cocktailState.glass;
        if (cocktailState.hasOwnProperty("garnish")) this.garnish = cocktailState.garnish;
        if (cocktailState.hasOwnProperty("preparation")) this.preparation = cocktailState.preparation;

        if (cocktailState.hasOwnProperty("ingredients")) {
            this.ingredients = cocktailState.ingredients.map(ingredientState => {
                if (ingredientState.hasOwnProperty("ingredient")) {
                    return IngredientData.createFromJSON(ingredientState);
                } else if (ingredientState.hasOwnProperty("special")) {
                    return SpecialIngredientData.createFromJSON(ingredientState);
                } else {
                    return null;
                }
            }).filter(ingredient => ingredient !== null);
        }

        return this;
    }

    clone() {
        return CocktailData.createFromJSON(this.toJSON());
    }

    undo(steps = 1) {
        if (this.stateIndex >= steps) {
            this.stateIndex -= steps;
            this.fromJSON(this.previousStates[this.stateIndex]);
        } else {
            this.stateIndex = 0;
            this.fromJSON(this.previousStates[this.stateIndex]);
        }

        this.dirty = false;

        return this;
    }

    redo(steps = 1) {
        if (this.stateIndex < this.previousStates.length - steps) {
            this.stateIndex += steps;
            this.fromJSON(this.previousStates[this.stateIndex]);
        } else {
            this.stateIndex = this.previousStates.length - 1;
            this.fromJSON(this.previousStates[this.stateIndex]);
        }

        this.dirty = false;

        return this;
    }

    revert() {
        return this.undo();
    }

    checkpoint() {
        if (this.stateIndex < this.previousStates.length - 1) {
            this.previousStates = this.previousStates.slice(0, this.stateIndex + 1);
        }

        this.previousStates.push(this.toJSON());
        this.dirty = false;
        this.stateIndex = this.previousStates.length - 1;

        return this;
    }

    isPlaceholderImage() {
        return this.image === "Shaker.png";
    }
}

class I_IngredientData {
    previousStates = [];
    _stateIndex = 0;
    dirty = false;

    get stateIndex() {
        return this._stateIndex;
    }

    set stateIndex(value) {
        if (value >= 0 && value < this.previousStates.length) {
            this._stateIndex = value;
        } else {
            throw new RangeError(`State index ${value} is out of range. Min: 0, Max: ${this.previousStates.length - 1}`);
        }
    }

    toJSON() {
        return {};
    }

    fromJSON(ingredientState) {
        return this;
    }

    clone() {
        return new IngredientData();
    }

    undo(steps = 1) {
        if (this.stateIndex >= steps) {
            this.stateIndex -= steps;
            this.fromJSON(this.previousStates[this.stateIndex]);
        } else {
            this.stateIndex = 0;
            this.fromJSON(this.previousStates[this.stateIndex]);
        }

        this.dirty = false;

        return this;
    }

    redo(steps = 1) {
        if (this.stateIndex < this.previousStates.length - steps) {
            this.stateIndex += steps;
            this.fromJSON(this.previousStates[this.stateIndex]);
        } else {
            this.stateIndex = this.previousStates.length - 1;
            this.fromJSON(this.previousStates[this.stateIndex]);
        }

        this.dirty = false;

        return this;
    }

    revert() {
        return this.undo();
    }

    checkpoint() {
        if (this.stateIndex < this.previousStates.length - 1) {
            this.previousStates = this.previousStates.slice(0, this.stateIndex + 1);
        }

        this.previousStates.push(this.toJSON());
        this.dirty = false;
        this.stateIndex = this.previousStates.length - 1;

        return this;
    }
}

class IngredientData extends I_IngredientData {
    _name = "Unknown Ingredient";
    _label = null;
    _amount = 0;
    _unit = "oz";

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
        this.dirty = true;
    }

    get amount() {
        return this._amount;
    }

    set amount(value) {
        this._amount = value;
        this.dirty = true;
    }

    get unit() {
        return this._unit;
    }

    set unit(value) {
        this._unit = value;
        this.dirty = true;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
        this.dirty = true;
    }

    static createFromJSON(ingredientState) {
        const result = new IngredientData();
        result.fromJSON(ingredientState).checkpoint();
        return result;
    }

    toJSON() {
        const result = super.toJSON();
        return {
            ...result,
            ingredient: this.name,
            amount: this.amount,
            unit: this.unit
        };
    }

    fromJSON(ingredientState) {
        super.fromJSON(ingredientState);
        if (ingredientState.hasOwnProperty("ingredient")) this.name = ingredientState.ingredient;
        if (ingredientState.hasOwnProperty("amount")) this.amount = ingredientState.amount;
        if (ingredientState.hasOwnProperty("unit")) this.unit = ingredientState.unit;
        if (ingredientState.hasOwnProperty("label")) this.label = ingredientState.label;

        this.previousState = this.toJSON();
        return this;
    }

    clone() {
        return IngredientData.createFromJSON(this.toJSON());
    }
}

class SpecialIngredientData extends I_IngredientData {
    _text = "";

    get text() {
        return this._text;
    }

    set text(value) {
        this._text = value;
        this.dirty = true;
    }

    static createFromJSON(ingredientState) {
        const result = new SpecialIngredientData();
        result.fromJSON(ingredientState).checkpoint();
        return result;
    }

    toJSON() {
        const result = super.toJSON();

        return {
            ...result,
            special: this.text
        };
    }

    fromJSON(ingredientState) {
        super.fromJSON(ingredientState);

        if (ingredientState.hasOwnProperty("special")) this.text = ingredientState.special;

        this.previousState = this.toJSON();
        return this;
    }

    clone() {
        return SpecialIngredientData.createFromJSON(this.toJSON());
    }

    revert() {
        this.fromJSON(this.previousState);
        this.dirty = false;
        return this;
    }
}

export { CocktailData, IngredientData, SpecialIngredientData };