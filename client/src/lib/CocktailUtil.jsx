import { useMountEffect } from "src/lib/Misc";
import { useState, useContext, createContext } from "react";
import { useApi } from "src/lib/Api";

export class CocktailData {
    id = null;
    name = "Unknown Cocktail";
    image = "Shaker.jpg";
    category = "Unknown Category";
    glass = "Unknown Glass";
    garnish = "None";
    ingredients = [];
    preparation = "None";

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

    isDirty(type=null) {
        return !this.jsonEquals(this.lastCheckpoint(type, this.stateIndex));
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

    jsonEquals(cocktailState) {
        cocktailState = cocktailState || {};
        if (cocktailState.hasOwnProperty("_id") && this.id !== cocktailState._id) return false;
        if (cocktailState.hasOwnProperty("name") && this.name !== cocktailState.name) return false;
        if (cocktailState.hasOwnProperty("image") && this.image !== cocktailState.image) return false;
        if (cocktailState.hasOwnProperty("category") && this.category !== cocktailState.category) return false;
        if (cocktailState.hasOwnProperty("glass") && this.glass !== cocktailState.glass) return false;
        if (cocktailState.hasOwnProperty("garnish") && this.garnish !== cocktailState.garnish) return false;
        if (cocktailState.hasOwnProperty("preparation") && this.preparation !== cocktailState.preparation) return false;

        if (cocktailState.hasOwnProperty("ingredients")) {
            if (cocktailState.ingredients.length !== this.ingredients.length) return false;

            for (let i = 0; i < cocktailState.ingredients.length; i++) {
                if (!this.ingredients[i].jsonEquals(cocktailState.ingredients[i])) return false;
            }
        }

        return true;
    }

    clone() {
        return CocktailData.createFromJSON(this.toJSON(), this._push, this._pull);
    }

    currentCheckpoint() {
        return this.previousStates[this.stateIndex] || null;
    }

    lastCheckpointIndex(type=null, start) {
        if (type === null) return this.previousStates.length - 2;

        start = start || this.stateIndex;
        for (let i = start; i >= 0; i--) {
            if (this.previousStates[i].type === type) return i;
        }

        return -1;
    }

    lastCheckpoint(type=null, start) {
        const index = this.lastCheckpointIndex(type, start);
        if (index === -1) return null;
        return this.previousStates[index];
    }

    countCheckpoints(type=null, max=Infinity) {
        if (type === null) return this.previousStates.length;

        let count = 0;
        for (let i = 0; i < Math.min(this.previousStates.length, max); i++) {
            if (this.previousStates[i].type === type) count++;
        }

        return count;
    }

    undo(steps = 1, type=null) {
        if (this.countCheckpoints(type) === 0) return this;

        let index = this.stateIndex;
        for (let i = 0; i < steps; i++) {
            index = this.lastCheckpointIndex(type, index - 1);
            if (index === -1) {
                throw new Error(`Could not find checkpoint number ${i + 1} of type ${type}.`);
            }
        }

        this.fromJSON(this.currentCheckpoint());

        return this;
    }

    redo(steps = 1, type=null) {
        if (this.countCheckpoints(type) === 0) return this;

        let index = this.stateIndex;
        for (let i = 0; i < steps; i++) {
            index = this.lastCheckpointIndex(type, index + 1);
            if (index === -1) {
                throw new Error(`Could not find checkpoint number ${i + 1} of type ${type}.`);
            }
        }

        this.fromJSON(this.currentCheckpoint());

        return this;
    }

    revert(type=null) {
        return this.undo(1, type);
    }

    checkpoint(type) {
        if (this.stateIndex < this.previousStates.length - 1) {
            this.previousStates = this.previousStates.slice(0, this.stateIndex + 1);
        }

        const checkpoint = this.toJSON();
        checkpoint.type = type || "manual";
        this.previousStates.push(checkpoint);
        this.stateIndex = this.previousStates.length - 1;

        this.ingredients.forEach(ingredient => ingredient.checkpoint());

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
                this.checkpoint("push");
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

                this.checkpoint("pull");
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

export class I_IngredientData {
    previousStates = [];
    _stateIndex = 0;

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

    isDirty() {
        return !this.jsonEquals(this.currentCheckpoint());
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

    currentCheckpoint() {
        return this.previousStates[this.stateIndex] || {};
    }

    undo(steps = 1) {
        if (this.stateIndex >= steps) {
            this.stateIndex -= steps;
        } else {
            this.stateIndex = 0;
        }

        this.fromJSON(this.currentCheckpoint());

        return this;
    }

    redo(steps = 1) {
        if (this.stateIndex < this.previousStates.length - steps) {
            this.stateIndex += steps;
        } else {
            this.stateIndex = this.previousStates.length - 1;
        }

        this.fromJSON(this.currentCheckpoint());

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
        this.stateIndex = this.previousStates.length - 1;

        return this;
    }
}

export class IngredientData extends I_IngredientData {
    name = "Unknown Ingredient";
    label = null;
    amount = 0;
    unit = "oz";

    static createFromJSON(ingredientState) {
        const result = new IngredientData();
        result.fromJSON(ingredientState).checkpoint();
        return result;
    }

    toJSON() {
        const result = {
            ingredient: this.name,
            amount: this.amount,
            unit: this.unit
        };

        if (this.label) result.label = this.label;

        return result;
    }

    fromJSON(ingredientState) {
        if (ingredientState.hasOwnProperty("ingredient")) this.name = ingredientState.ingredient;
        if (ingredientState.hasOwnProperty("amount")) this.amount = ingredientState.amount;
        if (ingredientState.hasOwnProperty("unit")) this.unit = ingredientState.unit;
        if (ingredientState.hasOwnProperty("label")) this.label = ingredientState.label;
        
        return this;
    }

    jsonEquals(ingredientState) {
        ingredientState = ingredientState || {};
        if (ingredientState.hasOwnProperty("ingredient") && this.name !== ingredientState.ingredient) return false;
        if (ingredientState.hasOwnProperty("amount") && this.amount !== ingredientState.amount) return false;
        if (ingredientState.hasOwnProperty("unit") && this.unit !== ingredientState.unit) return false;
        if (ingredientState.hasOwnProperty("label") && this.label !== ingredientState.label) return false;

        return true;
    }


    clone() {
        return IngredientData.createFromJSON(this.toJSON());
    }

    isSpecial() {
        return false;
    }
}

export class SpecialIngredientData extends I_IngredientData {
    text = "";

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

        return this;
    }

    jsonEquals(ingredientState) {
        ingredientState = ingredientState || {};
        if (ingredientState.hasOwnProperty("special") && this.text !== ingredientState.special) return false;

        return true;
    }

    clone() {
        return SpecialIngredientData.createFromJSON(this.toJSON());
    }

    isSpecial() {
        return true;
    }
}

export function useCocktailData(value, primaryKey="name") {
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
    useMountEffect(() => {
        cocktailData.pull();
    });

    return cocktailData;
}

export const CocktailDataContext = createContext(undefined);

export function useCocktailDataContext() {
    const context = useContext(CocktailDataContext);
    if (context === undefined) {
        throw new Error("No CocktailDataContext provider found.");
    }
    return context;
}