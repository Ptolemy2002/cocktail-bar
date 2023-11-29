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

    // Used to determine whether the cocktail has been modified since the last checkpoint.
    previousState = {};
    dirty = false;

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
            ingredients: this.ingredients.slice(),
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
        if (cocktailState.hasOwnProperty("ingredients")) this.ingredients = cocktailState.ingredients;
        if (cocktailState.hasOwnProperty("preparation")) this.preparation = cocktailState.preparation;

        this.previousState = this.toJSON();
        return this;
    }

    clone() {
        return CocktailData.createFromJSON(this.toJSON());
    }

    revert() {
        this.fromJSON(this.previousState);
        this.dirty = false;
        return this;
    }

    checkpoint() {
        this.previousState = this.toJSON();
        this.dirty = false;
        return this;
    }

    isPlaceholderImage() {
        return this.image === "Shaker.png";
    }
}

export { CocktailData };