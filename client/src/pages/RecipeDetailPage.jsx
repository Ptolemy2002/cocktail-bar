import React, {useState, useRef} from "react";
import { useApi } from "src/lib/Api";
import { useParams } from "react-router-dom";
import { useCocktailData, IngredientData, SpecialIngredientData } from "src/lib/CocktailUtil";
import NotFoundPage from "src/pages/NotFoundPage";
import { nanoid } from "nanoid";
import CocktailImage from "src/components/CocktailImage";
import { useMountEffect } from "src/lib/Misc";
import { EditField } from "src/lib/Form";

export default function QueryWrapper() {
    const { name } = useParams();

    return (
        <RecipeDetailPage
            name={name}
        />
    );
}

export function RecipeDetailPage(props) {
    const cocktailData = useCocktailData(props.name);

    document.title = `${cocktailData.name} | Cocktail Bar`;
    const [editMode, _setEditMode] = useState(false);

    function setEditMode(v) {
        _setEditMode(v);
        if (v && !editMode) {
            cocktailData.checkpoint();
        }
    }

    // If lastRequest is null, the pull has not been started yet, but will be soon
    if (cocktailData.pullInProgress() || cocktailData.lastRequest === null) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{props.name}</h1>
                <p>Retrieving cocktail data...</p>
            </div>
        );
    } else if (cocktailData.pullFailed()) {
        if (cocktailData.requestError?.is404) return <NotFoundPage />;
        return (
            <div className="RecipeDetailPage container">
                <h1>{props.name}</h1>
                <p className="text-danger">Failed to retrieve cocktail data. Error details logged to console.</p>
            </div>
        );
    } else {
        let requestInfoElement = null;

        if (cocktailData.pushInProgress()) {
            requestInfoElement = (
                <p className="text-info">Updating cocktail data... Other operations will be unavailable until this operation completes.</p>
            );
        } else if (cocktailData.pushFailed()) {
            requestInfoElement = (
                <p className="text-danger">Failed to update cocktail data. Error details logged to console.</p>
            );
        } else if (cocktailData.pushSuccessful()) {
            requestInfoElement = (
                <p className="text-success">Successfully updated cocktail data.</p>
            );
        } else if (cocktailData.deleteInProgress()) {
            requestInfoElement = (
                <p className="text-info">Deleting cocktail... Other operations will be unavailable until this operation completes.</p>
            );
        } else if (cocktailData.deleteFailed()) {
            requestInfoElement = (
                <p className="text-danger">Failed to delete cocktail. Error details logged to console.</p>
            );
        } else if (cocktailData.deleteSuccessful()) {
            requestInfoElement = (
                <p className="text-success">Successfully deleted cocktail.</p>
            );
        } else if (cocktailData.duplicateInProgress()) {
            requestInfoElement = (
                <p className="text-info">Duplicating cocktail... Other operations will be unavailable until this operation completes.</p>
            );
        } else if (cocktailData.duplicateFailed()) {
            requestInfoElement = (
                <p className="text-danger">Failed to duplicate cocktail. Error details logged to console.</p>
            );
        } else if (cocktailData.duplicateSuccessful()) {
            requestInfoElement = (
                <p className="text-success">Successfully duplicated cocktail.</p>
            );
        }

        if (editMode) {
            return (
                <div className="RecipeDetailPage container">
                    <h1>{cocktailData.name}</h1>
                    {requestInfoElement}
                    <RecipeDetailEdit
                        cocktailData={cocktailData}
                        exit={() => {
                            setEditMode(false);
                        }}
                        exitWithoutSaving={() => {
                            cocktailData.revert();
                            setEditMode(false);
                        }}
                    />
                </div>
            );
        } else {
            return (
                <div className="RecipeDetailPage container">
                    <h1>{cocktailData.name}</h1>
                    {
                        (cocktailData.isDirty() && !cocktailData.pushFailed()) ? (
                            <p className="text-warning">
                                This cocktail has unpublished changes that will be lost if you refresh the page or click the refresh button.
                                Click the "Publish" button to publish them.
                            </p>
                        ) : null
                    }
                    {requestInfoElement}

                    <div className="btns-hor mb-3">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => cocktailData.pull()}
                            disabled={cocktailData.requestInProgress}
                        >
                            {
                                cocktailData.pullInProgress() ?
                                    "Refreshing...":
                                cocktailData.requestInProgress ?
                                    "Unavailable":
                                // Else
                                "Refresh"
                            }
                        </button>

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => setEditMode(true)}
                        >
                            Edit
                        </button>

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                cocktailData.push(() => {
                                    // If the name changed, this redirect will be necessary to avoid a 404
                                    window.location.href = `/recipe/${encodeURIComponent(cocktailData.name)}`;
                                });
                            }}
                            disabled={cocktailData.requestInProgress || !cocktailData.isDirty()}
                        >
                            {
                                cocktailData.pushInProgress() ?
                                    "Publishing...":
                                cocktailData.requestInProgress ?
                                    "Unavailable":
                                !cocktailData.isDirty() ?
                                    "No Changes":
                                // Else
                                "Publish"
                            }
                        </button>

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                cocktailData.duplicate((data) => {
                                    window.location.href = `/recipe/${encodeURIComponent(data.name)}`;
                                });
                            }}
                            disabled={cocktailData.requestInProgress}
                        >
                            {
                                cocktailData.duplicateInProgress() ?
                                    "Duplicating...":
                                cocktailData.requestInProgress ?
                                    "Unavailable":
                                // Else
                                "Publish as Duplicate"
                            }
                        </button>

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                cocktailData.delete(() => {
                                    window.location.href = "/";
                                });
                            }}
                            disabled={cocktailData.requestInProgress}
                        >
                            {
                                cocktailData.deleteInProgress() ?
                                    "Deleting...":
                                cocktailData.requestInProgress ?
                                    "Unavailable":
                                // Else
                                "Delete"
                            }
                        </button>
                    </div>
    
                    <RecipeDetailDisplay cocktailData={cocktailData} />
                </div>
            );
        }
    }
}

export function RecipeDetailDisplay(props) {
    const data = props.cocktailData;
    const altText = data.isPlaceholderImage() ? "Placeholder image" : `Image of a "${data.name}" cocktail`;

    const ingredientElements = data.ingredients.map((ingredient, i) => {
        if (ingredient.isSpecial()) {
                return (
                    <li key={"ingredient-" + i}>
                        <i>{ingredient.text}</i>
                    </li>
                );
        } else {
            return (
                <li key={"ingredient-" + i}>
                    {ingredient.amount}{ingredient.unit} of {ingredient.name}{ingredient.label ? ` (${ingredient.label})` : ""}
                </li>
            );
        }
    });

    return (
        <div className="recipe-detail-container">
            <CocktailImage src={data.image} alt={altText} className="img-fluid cover-img" />

            <h2>Properties</h2>
            <h5>{data.category}</h5>
            <p>
                <b>Glass: </b> {data.glass} <br />
                <b>Garnish: </b> {data.garnish} <br />
            </p>

            <h2>Ingredients</h2>
            <ul className="ingredient-list">
                {ingredientElements}
            </ul>

            <h2>Preparation Instructions</h2>
            <p>{data.preparation}</p>
        </div>
    );
}

export function RecipeEditField(props) {
    const newProps = {
        key: props.name + "-edit",
        value: props.value,
        defaultValue: props.defaultValue || "",
        list: props.list,
        listStatus: props.listStatus,
        refreshHandler: props.refreshHandler,
        label: props.label,
        name: props.name,
        placeholder: props.placeholder || `Enter ${props.label} Here`,
        inProgressMessage: props.inProgressMessage || `Retrieving ${props.label.toLowerCase()} options...`,
        failedMessage: props.failedMessage || `Failed to retrieve ${props.label.toLowerCase()} options. Error details logged to console.`,
        existingMessage: props.existingMessage || `Use Existing ${props.label}`,
        customMessage: props.customMessage || `Use Custom ${props.label}`,
        refreshMessage: props.refreshMessage || `Refresh ${props.label} Options`,
        setValue: props.setValue,
        optionsClassName: props.optionsClassName || "btns-hor",
        custom: props.custom || false,
        staticCustom: props.staticCustom || false,
        number: props.number || false,
        integer: props.integer || false,
        min: props.min || null,
        max: props.max || null,
        manualSave: props.manualSave || false
    };

    return (
        <EditField {...newProps} />
    );
}

export function RecipeDetailEdit(props) {
    const data = props.cocktailData;

    const [name, setName] = useState(data.name);
    const [image, setImage] = useState(data.image);
    const [category, setCategory] = useState(data.category);
    const [glass, setGlass] = useState(data.glass);
    const [garnish, setGarnish] = useState(data.garnish);
    const [ingredients, setIngredients] = useState(data.ingredients);
    const [preparation, setPreparation] = useState(data.preparation);
    const preparationTextBox = useRef(null);

    const [imageList, imageListStatus, imageListRefresh] = useApi("recipes/all/list-image/distinct", true);
    const [categoryList, categoryListStatus, categoryListRefresh] = useApi("recipes/all/list-category/distinct", true);
    const [glassList, glassListStatus, glassListRefresh] = useApi("recipes/all/list-glass/distinct", true);
    const [garnishList, garnishListStatus, garnishListRefresh] = useApi("recipes/all/list-garnish/distinct", true);

    // Refresh the lists when the component is first mounted
    useMountEffect(() => {
        imageListRefresh();
        categoryListRefresh();
        glassListRefresh();
        garnishListRefresh();
    });

    function preparationChanged(event) {
        setPreparation(event.target.value);
    }

    function save() {
        data.name = name;
        data.image = image;
        data.category = category;
        data.glass = glass;
        data.garnish = garnish;
        data.ingredients = ingredients;
        data.preparation = preparation;
    }

    return (
        <div className="recipe-detail-container">
            <h2>Properties</h2>
            <RecipeEditField
                name="name"
                label="Name"
                value={name}
                setValue={setName}
                custom={true}
                staticCustom={true}
            />

            <RecipeEditField
                name="image"
                label="Image"
                value={image}
                list={imageList}
                listStatus={imageListStatus}
                refreshHandler={imageListRefresh}
                setValue={setImage}
            />

            <RecipeEditField
                name="category"
                label="Category"
                value={category}
                list={categoryList}
                listStatus={categoryListStatus}
                refreshHandler={categoryListRefresh}
                setValue={setCategory}
            />

            <RecipeEditField
                name="glass"
                label="Glass"
                value={glass}
                list={glassList}
                listStatus={glassListStatus}
                refreshHandler={glassListRefresh}
                setValue={setGlass}
            />

            <RecipeEditField
                name="garnish"
                label="Garnish"
                value={garnish}
                list={garnishList}
                listStatus={garnishListStatus}
                refreshHandler={garnishListRefresh}
                setValue={setGarnish}
            />

            <h2>Ingredients</h2>
            <IngredientEditList ingredients={ingredients} setIngredients={setIngredients} />

            <h2>Preparation Instructions</h2>
            <textarea ref={preparationTextBox} className="form-control mb-3" value={preparation} onChange={preparationChanged} />
            
            <h2>Options</h2>
            <div className="btns-hor">
                <button className="btn btn-outline-secondary" onClick={() => {
                        save();
                        props.exit();
                    }}
                >
                    Save Changes
                </button>

                <button className="btn btn-outline-secondary" onClick={props.exitWithoutSaving}>
                    Discard Changes
                </button>
            </div>
        </div>
    );
}

export function IngredientEditList(props) {
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;
    const [ingredientNameList, ingredientNameListStatus, ingredientNameListRefresh] = useApi("recipes/all/list-ingredient/distinct", true);

    useMountEffect(ingredientNameListRefresh);

    function addIngredient() {
        setIngredients(ingredients.concat(IngredientData.createFromJSON({})));
    }

    function addSpecialIngredient() {
        setIngredients(ingredients.concat(SpecialIngredientData.createFromJSON({})));
    }

    function removeIngredient(index) {
        setIngredients(ingredients.filter((ingredient, i) => i !== index));
    }

    function ingredientUpHandler(index) {
        return () => {
            if (index > 0) {
                const newIngredients = [...ingredients];
                const temp = newIngredients[index - 1];
                newIngredients[index - 1] = newIngredients[index];
                newIngredients[index] = temp;
                setIngredients(newIngredients);
            }
        };
    }

    function ingredientDownHandler(index) {
        return () => {
            if (index < ingredients.length - 1) {
                const newIngredients = [...ingredients];
                const temp = newIngredients[index + 1];
                newIngredients[index + 1] = newIngredients[index];
                newIngredients[index] = temp;
                setIngredients(newIngredients);
            }
        };
    }

    const ingredientElements = ingredients.map((ingredient, i) => {
        return (
            <div key={"ingredient-edit-" + nanoid()} className="ingredient-container mb-2">
                <IngredientEdit
                    ingredient={ingredient}
                    removeIngredient={() => removeIngredient(i)}
                    isFirstChild={i === 0}
                    isLastChild={i === ingredients.length - 1}
                    moveUp={ingredientUpHandler(i)}
                    moveDown={ingredientDownHandler(i)}
                    nameList={ingredientNameList}
                    nameListStatus={ingredientNameListStatus}
                    nameListRefresh={ingredientNameListRefresh}
                />
            </div>
        );
    });

    return (
        <div className="ingredient-edit-list mb-3">
            {ingredientElements}
            <div className="btns-hor">
                <button className="btn btn-outline-secondary" onClick={addIngredient}>
                    Add Ingredient
                </button>

                <button className="btn btn-outline-secondary" onClick={addSpecialIngredient}>
                    Add Special Ingredient
                </button>
            </div>
        </div>
    );
}

export function IngredientEdit(props) {
    const ingredient = props.ingredient;
    const removeIngredient = props.removeIngredient;

    const [name, _setName] = useState(ingredient.name);
    const [amount, _setAmount] = useState(ingredient.amount);
    const [unit, _setUnit] = useState(ingredient.unit);
    const [text, _setText] = useState(ingredient.text);
    const [label, _setLabel] = useState(ingredient.label);
    const [useLabel, _setUseLabel] = useState(!!ingredient.label);
    const labelCheckBox = useRef(null);

    function labelCheckBoxChanged() {
        setUseLabel(!useLabel);
    }

    function syncSetter(propertyName, setter) {
        return (value) => {
            setter(value);
            ingredient[propertyName] = value;
        };
    }

    const setName = syncSetter("name", _setName);
    const setAmount = function(v) {
        // Unfinished values that wouldn't be valid numbers are converted to 0
        if (v === "" || v === "-" || v === "+") {
            _setAmount(0);
            ingredient.amount = 0;
        } else {
            _setAmount(parseFloat(v));
            ingredient.amount = parseFloat(v);
        }
    }
    const setUnit = syncSetter("unit", _setUnit);
    const setText = syncSetter("text", _setText);
    const setLabel = syncSetter("label", _setLabel);

    function setUseLabel(v) {
        _setUseLabel(v);
        if (v) {
            setLabel("");
        } else {
            setLabel(null);
        }
    }

    const [nameList, nameListStatus, nameListRefresh] = [props.nameList, props.nameListStatus, props.nameListRefresh];

    if (!ingredient.isSpecial()) {
        return (
            <div className="ingredient-edit">
                <RecipeEditField
                    name="name"
                    label="Name"
                    value={name}
                    list={nameList}
                    listStatus={nameListStatus}
                    refreshHandler={nameListRefresh}
                    setValue={setName}
                />

                <div className="form-check mb-1">
                    <input type="checkbox" className="form-check-input" id="use-label" checked={useLabel} onChange={labelCheckBoxChanged} ref={labelCheckBox} />
                    <label className="form-check-label" htmlFor="use-label">Use Label</label>
                </div>
                {
                    useLabel ? (
                        <RecipeEditField
                            name="label"
                            label="Label"
                            value={label}
                            setValue={setLabel}
                        />
                    ) : null
                }
                
                <RecipeEditField
                    name="amount"
                    label="Amount"
                    value={amount}
                    defaultValue=""
                    custom={true}
                    staticCustom={true}
                    setValue={setAmount}
                    number={true}
                    min={0}
                />

                <RecipeEditField
                    name="unit"
                    label="Unit"
                    value={unit}
                    setValue={setUnit}
                    custom={true}
                    staticCustom={true}
                />

                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={removeIngredient}>
                        Remove Ingredient
                    </button>

                    {
                        props.isFirstChild ? null : (
                            <button className="btn btn-outline-secondary" onClick={props.moveUp}>
                                Move Up
                            </button>
                        )
                    }

                    {
                        props.isLastChild ? null : (
                            <button className="btn btn-outline-secondary" onClick={props.moveDown}>
                                Move Down
                            </button>
                        )
                    }
                </div>
            </div>
        );
    } else {
        return (
            <div className="ingredient-edit">
                <RecipeEditField
                    name="text"
                    label="Text"
                    value={text}
                    custom={true}
                    staticCustom={true}
                    setValue={setText}
                />

                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={removeIngredient}>
                        Remove Ingredient
                    </button>

                    {
                        props.isFirstChild ? null : (
                            <button className="btn btn-outline-secondary" onClick={props.moveUp}>
                                Move Up
                            </button>
                        )
                    }

                    {
                        props.isLastChild ? null : (
                            <button className="btn btn-outline-secondary" onClick={props.moveDown}>
                                Move Down
                            </button>
                        )
                    }
                </div>
            </div>
        );
    }
}