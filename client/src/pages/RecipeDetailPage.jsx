import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import { useApi } from "src/lib/Api";
import { useParams } from "react-router-dom";
import { useCocktailData, IngredientData, SpecialIngredientData } from "src/lib/CocktailUtil";
import NotFoundPage from "src/pages/NotFoundPage";
import { nanoid } from "nanoid";
import CocktailImage from "src/components/CocktailImage";

function RecipeDetailPage() {
    const { name } = useParams();
    const cocktailData = useCocktailData(name);

    document.title = `${cocktailData.name} | Cocktail Bar`;
    const [editMode, setEditMode] = useState(false);

    // If lastRequest is null, the pull has not been started yet, but will be soon
    if (cocktailData.pullInProgress() || cocktailData.lastRequest === null) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Retrieving cocktail data...</p>
            </div>
        );
    } else if (cocktailData.pullFailed()) {
        if (cocktailData.requestError?.is404) return <NotFoundPage />;
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
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
                    <RecipeDetailEdit cocktailData={cocktailData} exit={() => setEditMode(false)} />
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

function RecipeDetailDisplay(props) {
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

function RecipeDetailEdit(props) {
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
    useEffect(() => {
        imageListRefresh();
        categoryListRefresh();
        glassListRefresh();
        garnishListRefresh();
    }, []);

    const [prevImage, setPrevImage] = useState(image);
    const [customImage, _setCustomImage] = useState(false);
    const [prevCategory, setPrevCategory] = useState(category);
    const [customCategory, _setCustomCategory] = useState(false);
    const [prevGlass, setPrevGlass] = useState(glass);
    const [customGlass, _setCustomGlass] = useState(false);
    const [prevGarnish, setPrevGarnish] = useState(garnish);
    const [customGarnish, _setCustomGarnish] = useState(false);

    useLayoutEffect(() => {
        if (preparationTextBox.current) {
            preparationTextBox.current.style.height = "auto";
            preparationTextBox.current.style.height = (preparationTextBox.current.scrollHeight) + "px";
        }
    }, []);

    function customPropertySetter(customSetter, valueSetter, prevSetter, prevValue, defaultValue) {
        return (value) => {
            customSetter(value);
            if (value) {
                prevSetter(prevValue);
                valueSetter(defaultValue);
            } else {
                valueSetter(prevValue);
            }
        };
    }

    const setCustomCategory = customPropertySetter(_setCustomCategory, setCategory, setPrevCategory, prevCategory, "");
    const setCustomGlass = customPropertySetter(_setCustomGlass, setGlass, setPrevGlass, prevGlass, "");
    const setCustomGarnish = customPropertySetter(_setCustomGarnish, setGarnish, setPrevGarnish, prevGarnish, "");
    const setCustomImage = customPropertySetter(_setCustomImage, setImage, setPrevImage, prevImage, "");

    function save() {
        data.name = name;
        data.image = image;
        data.category = category;
        data.glass = glass;
        data.garnish = garnish;
        data.ingredients = ingredients;
        data.preparation = preparation;
    }

    function changedHandler(setter) {
        return (event) => {
            setter(event.target.value);
        };
    }

    const nameChanged = changedHandler(setName);
    const imageChanged = changedHandler(setImage);
    const categoryChanged = changedHandler(setCategory);
    const glassChanged = changedHandler(setGlass);
    const garnishChanged = changedHandler(setGarnish);
    const preparationChanged = changedHandler(setPreparation);

    function customOrPickedListElement(custom, choice, list, listStatus, changedHandler, inProgressMessage, failedMessage, choiceLabel, inputLabel, inputPlaceholder) {
        if (!custom) {
            if (!listStatus.completed) {
                return (
                    <p>{inProgressMessage}</p>
                );
            } else if (listStatus.failed) {
                return (
                    <p className="text-danger">{failedMessage}</p>
                );
            } else {
                const options = list.map((item, i) => {
                    return (
                        <option key={"option-" + i} value={item}>{item}</option>
                    );
                });

                return (
                    <div className="mb-1">
                        {choiceLabel}
                        <select className="form-control mb-1" value={choice} onChange={changedHandler}>
                            {options}
                        </select>
                    </div>
                );
            }
        } else {
            return (
                <div className="mb-1">
                    {inputLabel}
                    <input type="text" placeholder={inputPlaceholder} className="form-control mb-1" value={choice} onChange={changedHandler} />
                </div>
            );
        }
    }

    const imageListElement = customOrPickedListElement(
        customImage, image, imageList, imageListStatus, imageChanged,
        "Retrieving image options...",
        "Failed to retrieve image options. Error details logged to console.",
        "Choose an image",
        "If your image source is a URL, prepend the URL with \"url-\" (without quotes).",
        "Enter Image Here"
    );

    const categoryListElement = customOrPickedListElement(
        customCategory, category, categoryList, categoryListStatus, categoryChanged,
        "Retrieving category options...",
        "Failed to retrieve category options. Error details logged to console.",
        "Choose a category",
        null,
        "Enter Category Here"
    );

    const glassListElement = customOrPickedListElement(
        customGlass, glass, glassList, glassListStatus, glassChanged,
        "Retrieving glass options...",
        "Failed to retrieve glass options. Error details logged to console.",
        "Choose a glass",
        null,
        "Enter Glass Here"
    );

    const garnishListElement = customOrPickedListElement(
        customGarnish, garnish, garnishList, garnishListStatus, garnishChanged,
        "Retrieving garnish options...",
        "Failed to retrieve garnish options. Error details logged to console.",
        "Choose a garnish",
        null,
        "Enter Garnish Here"
    );

    function existingOrCustomOptionsElement(custom, customSetter, refreshHandler, existingMessage, customMessage, refreshMessage) {
        return (
            <div className="btns-hor">
                <button className="btn btn-outline-secondary" onClick={() => customSetter(!custom)}>
                    {custom ? existingMessage : customMessage}
                </button>
                {
                    custom ? null : (
                        <button className="btn btn-outline-secondary" onClick={refreshHandler}>
                            {refreshMessage}
                        </button>
                    )
                }
            </div>
        );
    }

    const imageCustomOptionsElement = existingOrCustomOptionsElement(
        customImage, setCustomImage, imageListRefresh,
        "Use Existing Image",
        "Use Custom Image",
        "Refresh Image Options"
    );

    const categoryCustomOptionsElement = existingOrCustomOptionsElement(
        customCategory, setCustomCategory, categoryListRefresh,
        "Use Existing Category",
        "Use Custom Category",
        "Refresh Category Options"
    );

    const glassCustomOptionsElement = existingOrCustomOptionsElement(
        customGlass, setCustomGlass, glassListRefresh,
        "Use Existing Glass",
        "Use Custom Glass",
        "Refresh Glass Options"
    );

    const garnishCustomOptionsElement = existingOrCustomOptionsElement(
        customGarnish, setCustomGarnish, garnishListRefresh,
        "Use Existing Garnish",
        "Use Custom Garnish",
        "Refresh Garnish Options"
    );

    return (
        <div className="recipe-detail-container">
            <h2>Properties</h2>
            <div className="form-group mb-3">
                <label htmlFor="name"><h6>Name</h6></label>
                <input type="text" placeholder="Enter Name Here" className="form-control" value={name} onChange={nameChanged} />
            </div>

            <div className="form-group mb-3">
                <label htmlFor="image"><h6>Image</h6></label>
                {imageListElement}
                {imageCustomOptionsElement}
            </div>

            <div className="form-group mb-3">
                <label htmlFor="category"><h6>Category</h6></label>
                {categoryListElement}
                {categoryCustomOptionsElement}
            </div>
            <div className="form-group mb-3">
                <label htmlFor="glass"><h6>Glass</h6></label>
                {glassListElement}
                {glassCustomOptionsElement}
            </div>
            <div className="form-group mb-3">
                <label htmlFor="garnish"><h6>Garnish</h6></label>
                {garnishListElement}
                {garnishCustomOptionsElement}
            </div>

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

                <button className="btn btn-outline-secondary" onClick={props.exit}>
                    Discard Changes
                </button>
            </div>
        </div>
    );
}

function IngredientEditList(props) {
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;
    const [ingredientNameList, ingredientNameListStatus, ingredientNameListRefresh] = useApi("recipes/all/list-ingredient/distinct", true);

    useEffect(ingredientNameListRefresh, []);

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

function IngredientEdit(props) {
    const ingredient = props.ingredient;
    const removeIngredient = props.removeIngredient;

    const [name, setName] = useState(ingredient.name);
    const [amount, setAmount] = useState(ingredient.amount);
    const [unit, setUnit] = useState(ingredient.unit);
    const [text, setText] = useState(ingredient.text);
    const [label, setLabel] = useState(ingredient.label);
    const [useLabel, setUseLabel] = useState(!!ingredient.label);
    const labelCheckBox = useRef(null);

    const [nameList, nameListStatus, nameListRefresh] = [props.nameList, props.nameListStatus, props.nameListRefresh];
    const [customName, _setCustomName] = useState(false);
    const [prevName, setPrevName] = useState(name);

    function setCustomName(value) {
        _setCustomName(value);
        if (value) {
            setPrevName(name);
            setName("");
        } else {
            setName(prevName);
        }
    }

    function labelCheckBoxChanged(event) {
        setUseLabel(event.target.checked);
        if (!event.target.checked) {
            setLabel(null);
            ingredient.label = null;
        }
    }

    function changedHandler(setter, property) {
        return (event) => {
            setter(event.target.value);
            ingredient[property] = event.target.value;
        };
    }

    const nameChanged = changedHandler(setName, "name");
    const labelChanged = changedHandler(setLabel, "label");
    const amountChanged = changedHandler(setAmount, "amount");
    const unitChanged = changedHandler(setUnit, "unit");
    const textChanged = changedHandler(setText, "text");

    function propertyEditElement(property, value, changedHandler, label, placeholder) {
        return (
            <div className="form-group mb-1">
                <label htmlFor={property}><h6>{label}</h6></label>
                <input type="text" placeholder={placeholder} className="form-control" value={value} onChange={changedHandler} />
            </div>
        );
    }

    function customOrPickedListElement(custom, choice, list, listStatus, changedHandler, inProgressMessage, failedMessage, choiceLabel, inputLabel, inputPlaceholder) {
        if (!custom) {
            if (!listStatus.completed) {
                return (
                    <p>{inProgressMessage}</p>
                );
            } else if (listStatus.failed) {
                return (
                    <p className="text-danger">{failedMessage}</p>
                );
            } else {
                const options = list.map((item, i) => {
                    return (
                        <option key={"option-" + i} value={item}>{item}</option>
                    );
                });

                return (
                    <div className="mb-1">
                        {choiceLabel}
                        <select className="form-control mb-1" value={choice} onChange={changedHandler}>
                            {options}
                        </select>
                    </div>
                );
            }
        } else {
            return (
                <div className="mb-1">
                    {inputLabel}
                    <input type="text" placeholder={inputPlaceholder} className="form-control mb-1" value={choice} onChange={changedHandler} />
                </div>
            );
        }
    }

    function existingOrCustomOptionsElement(custom, customSetter, refreshHandler, existingMessage, customMessage, refreshMessage) {
        return (
            <div className="btns-hor mb-2">
                <button className="btn btn-outline-secondary" onClick={() => customSetter(!custom)}>
                    {custom ? existingMessage : customMessage}
                </button>
                {
                    custom ? null : (
                        <button className="btn btn-outline-secondary" onClick={refreshHandler}>
                            {refreshMessage}
                        </button>
                    )
                }
            </div>
        );
    }

    if (!ingredient.isSpecial()) {
        const nameEditElement = customOrPickedListElement(
            customName, name, nameList, nameListStatus, nameChanged,
            "Retrieving ingredient name options...",
            "Failed to retrieve ingredient name options. Error details logged to console.",
            "Choose an ingredient name",
            null,
            "Enter Ingredient Name Here"
        );
        const nameOptionsElement = existingOrCustomOptionsElement(
            customName, setCustomName, nameListRefresh,
            "Use Existing Ingredient Name",
            "Use Custom Ingredient Name",
            "Refresh Ingredient Name Options"
        );

        const labelEditElement = propertyEditElement("label", label, labelChanged, "Label", "Enter Label Here");
        const amountEditElement = propertyEditElement("amount", amount, amountChanged, "Amount", "Enter Amount Here");
        const unitEditElement = propertyEditElement("unit", unit, unitChanged, "Unit", "Enter Unit Here");

        return (
            <div className="ingredient-edit">
                {nameEditElement}
                {nameOptionsElement}

                <div className="form-check mb-1">
                    <input type="checkbox" className="form-check-input" id="use-label" checked={useLabel} onChange={labelCheckBoxChanged} ref={labelCheckBox} />
                    <label className="form-check-label" htmlFor="use-label">Use Label</label>
                </div>
                {useLabel ? labelEditElement : null}
                
                {amountEditElement}
                {unitEditElement}

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
        const textEditElement = propertyEditElement("text", text, textChanged, "Text", "Enter Text Here");

        return (
            <div className="ingredient-edit">
                {textEditElement}

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

export default RecipeDetailPage;