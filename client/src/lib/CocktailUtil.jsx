const { useEffect, useState } = require("react");
const { useApi } = require("src/lib/Api");

class CocktailData {
    id = null;
    _name = "Unknown Cocktail";
    _image = "Shaker.jpg";
    _category = "Unknown Category";
    _glass = "Unknown Glass";
    _garnish = "None";
    _ingredients = [];
    _preparation = "None";

    lastRequest = null;
    requestInProgress = false;
    requestFailed = false;
    requestError = null;
    _push = null;
    _pull = null;
    _duplicate = null;
    _delete = null;

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

    static createFromID(id, _push, _pull, _duplicate, _delete) {
        const result = new CocktailData();
        result.id = id;
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
        return result;
    }

    static createFromJSON(cocktailState, _push, _pull, _duplicate, _delete) {
        const result = new CocktailData();
        result.fromJSON(cocktailState).checkpoint();
        result._push = _push;
        result._pull = _pull;
        result._duplicate = _duplicate;
        result._delete = _delete;
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
        return CocktailData.createFromJSON(this.toJSON(), this._push, this._pull);
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

    push(onSuccess, onFailure) {
        if (!this._push) throw new TypeError("Push function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "push") {
                console.warn("Attempted to push data while a push request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to push data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "push";
        this.requestError = null;
        this.requestFailed = false;
        this.requestInProgress = true;
        this._push({
            method: "POST",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.checkpoint();
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    pull(onSuccess, onFailure) {
        if (!this._pull) throw new TypeError("Pull function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "pull") {
                console.warn("Attempted to pull data while a pull request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to pull data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "pull";
        this.requestError = null;
        this.requestFailed = false;
        this.requestInProgress = true;

        this._pull({
            onSuccess: (data) => {
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        const err = new Error("No data returned from server.");
                        err.is404 = true;
                        this.requestError = err;
                        this.requestFailed = true;
                        this.requestInProgress = false;
                        if (onFailure) onFailure(err);
                        return;
                    }
                    
                    this.fromJSON(data[0]);
                } else {
                    this.fromJSON(data);
                }

                this.checkpoint();
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    duplicate(onSuccess, onFailure) {
        if (!this._duplicate) throw new TypeError("Duplicate function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "duplicate") {
                console.warn("Attempted to duplicate data while a duplicate request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to duplicate data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "duplicate";
        this.requestError = null;
        this.requestFailed = false;
        this.requestInProgress = true;

        this._duplicate({
            method: "POST",
            body: this.toJSON(),
            onSuccess: (data) => {
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    delete(onSuccess, onFailure) {
        if (!this._delete) throw new TypeError("Delete function not set.");
        if (this.requestInProgress) {
            if (this.lastRequest === "delete") {
                console.warn("Attempted to delete data while a delete request was already in progress. Ignoring...");
                return this;
            } else {
                throw new Error("Attempted to delete data while another request was in progress. This is not supported.");
            }
        }

        this.lastRequest = "delete";
        this.requestError = null;
        this.requestFailed = false;
        this.requestInProgress = true;

        this._delete({
            method: "POST",
            onSuccess: (data) => {
                this.requestInProgress = false;
                if (onSuccess) onSuccess(data);
            },

            onFailure: (err) => {
                this.requestError = err;
                this.requestFailed = true;
                this.requestInProgress = false;
                if (onFailure) onFailure(err);
            }
        });

        return this;
    }

    pullInProgress() {
        return this.requestInProgress && this.lastRequest === "pull";
    }

    pullFailed() {
        return this.requestFailed && this.lastRequest === "pull";
    }

    pullSuccessful() {
        return !this.requestInProgress && !this.requestFailed && this.lastRequest === "pull";
    }

    pushInProgress() {
        return this.requestInProgress && this.lastRequest === "push";
    }

    pushFailed() {
        return this.requestFailed && this.lastRequest === "push";
    }

    pushSuccessful() {
        return !this.requestInProgress && !this.requestFailed && this.lastRequest === "push";
    }

    duplicateInProgress() {
        return this.requestInProgress && this.lastRequest === "duplicate";
    }

    duplicateFailed() {
        return this.requestFailed && this.lastRequest === "duplicate";
    }

    duplicateSuccessful() {
        return !this.requestInProgress && !this.requestFailed && this.lastRequest === "duplicate";
    }

    deleteInProgress() {
        return this.requestInProgress && this.lastRequest === "delete";
    }

    deleteFailed() {
        return this.requestFailed && this.lastRequest === "delete";
    }

    deleteSuccessful() {
        return !this.requestInProgress && !this.requestFailed && this.lastRequest === "delete";
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
        throw new Error("Not implemented.");
    }

    fromJSON(ingredientState) {
        throw new Error("Not implemented.");
    }

    clone() {
        throw new Error("Not implemented.");
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
        return {
            ingredient: this.name,
            amount: this.amount,
            unit: this.unit
        };
    }

    fromJSON(ingredientState) {
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

    isSpecial() {
        return false;
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
        return {
            special: this.text
        };
    }

    fromJSON(ingredientState) {
        if (ingredientState.hasOwnProperty("special")) this.text = ingredientState.special;

        this.previousState = this.toJSON();
        return this;
    }

    clone() {
        return SpecialIngredientData.createFromJSON(this.toJSON());
    }

    isSpecial() {
        return true;
    }
}

function useCocktailData(value, primaryKey="name") {
    const _push = useApi(`recipes/update/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _pull = useApi(`recipes/get/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _duplicate = useApi(`recipes/duplicate/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2];
    const _delete = useApi(`recipes/delete/by-exact-${primaryKey}/${encodeURIComponent(value)}`)[2];

    const [cocktailData] = useState(
        primaryKey === "id" ? (
            CocktailData.createFromID(value, _push, _pull, _duplicate, _delete)
        ) :
        // else
        (
            CocktailData.createFromJSON({[primaryKey]: value}, _push, _pull, _duplicate, _delete)
        )
    );

    // Start pulling data on first load
    useEffect(() => {
        cocktailData.pull();
    }, []);

    return cocktailData;
}


export { CocktailData, IngredientData, SpecialIngredientData, useCocktailData };