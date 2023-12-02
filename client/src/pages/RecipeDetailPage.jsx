import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import { useApi } from "src/lib/Api";
import { useParams } from "react-router-dom";
import { CocktailData, IngredientData, SpecialIngredientData } from "src/lib/CocktailUtil";
import NotFoundPage from "./NotFoundPage";

function RecipeDetailPage() {
    const { name } = useParams();

    const _pull = useApi("recipes/name-equals/" + encodeURIComponent(name), {
        // This prevents immediately sending the request - Use the cocktailData.pull() function instead
        delaySend: true
    })[2];

    const _push = useApi("recipes/update/by-name/" + encodeURIComponent(name), {
        method: "POST",
        // This prevents immediately sending the request - Use the cocktailData.push() function instead
        delaySend: true
    })[2];

    const _cocktailData = useRef(CocktailData.createFromJSON({name: name}, _push, _pull));
    const cocktailData = _cocktailData.current;

    document.title = `${cocktailData.name} | Cocktail Bar`;
    const [editMode, setEditMode] = useState(false);

    // Pull the cocktail data when the component is first mounted
    useEffect(() => {
        cocktailData.pull();
    }, []);

    // If lastRequest is null, the pull has not been started yet, but will be soon
    if ((cocktailData.pullInProgress()) || cocktailData.lastRequest === null) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Retrieving cocktail data...</p>
            </div>
        );
    } else if (cocktailData.pullFailed()) {
        if (cocktailData.requestError.is404) return <NotFoundPage />;
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Failed to retrieve cocktail data. Error details logged to console.</p>
            </div>
        );
    } else {
        let pushInfoElement = null;

        if (cocktailData.pushInProgress()) {
            pushInfoElement = (
                <p className="text-info">Updating cocktail data...</p>
            );
        } else if (cocktailData.pushFailed()) {
            pushInfoElement = (
                <p className="text-danger">Failed to update cocktail data. Error details logged to console.</p>
            );
        } else if (cocktailData.lastRequest === "push") {
            pushInfoElement = (
                <p className="text-success">Successfully updated cocktail data.</p>
            );
        }

        if (editMode) {
            return (
                <div className="RecipeDetailPage container">
                    <h1>{cocktailData.name}</h1>
                    {pushInfoElement}
                    <RecipeDetailEdit cocktailData={cocktailData} exit={() => setEditMode(false)} />
                </div>
            );
        } else {
            return (
                <div className="RecipeDetailPage container">
                    <h1>{cocktailData.name}</h1>
                    {
                        cocktailData.dirty ? (
                            <p className="text-warning">
                                This cocktail has unpublished changes that will be lost if you refresh the page or click the refresh button.
                                Click the "Publish" button to publish them.
                            </p>
                        ) : null
                    }
                    {pushInfoElement}

                    <div className="btns-hor mb-3">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => cocktailData.pull()}
                            disabled={cocktailData.pullInProgress() || cocktailData.pushInProgress()}
                        >
                            Refresh
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
                        >
                            Publish
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
                    {ingredient.amount}{ingredient.unit} of {ingredient.name}
                </li>
            );
        }
    });

    return (
        <div className="recipe-detail-container">
            <img src={`/assets/images/${data.image}`} alt={altText} className="img-fluid cover-img" />

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

    const [imageList, imageListStatus, imageListRefresh] = useApi("recipes/all/list-image/distinct", {
        onSuccess: (data) => {
            // Sort the data alphabetically
            data.sort((a, b) => {
                return a.localeCompare(b);
            });
        },
    });
    const [categoryList, categoryListStatus, categoryListRefresh] = useApi("recipes/all/list-category/distinct", {
        onSuccess: (data) => {
            // Sort the data alphabetically
            data.sort((a, b) => {
                return a.localeCompare(b);
            });
        }
    });
    const [glassList, glassListStatus, glassListRefresh] = useApi("recipes/all/list-glass/distinct", {
        onSuccess: (data) => {
            // Sort the data alphabetically
            data.sort((a, b) => {
                return a.localeCompare(b);
            });
        }
    });
    const [garnishList, garnishListStatus, garnishListRefresh] = useApi("recipes/all/list-garnish/distinct", {
        onSuccess: (data) => {
            // Sort the data alphabetically
            data.sort((a, b) => {
                return a.localeCompare(b);
            });
        }
    });

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

    function setCustomCategory(value) {
        _setCustomCategory(value);
        if (value) {
            setPrevCategory(category);
            setCategory("");
        } else {
            setCategory(prevCategory);
        }
    }

    function setCustomGlass(value) {
        _setCustomGlass(value);
        if (value) {
            setPrevGlass(glass);
            setGlass("");
        } else {
            setGlass(prevGlass);
        }
    }

    function setCustomGarnish(value) {
        _setCustomGarnish(value);
        if (value) {
            setPrevGarnish(garnish);
            setGarnish("");
        } else {
            setGarnish(prevGarnish);
        }
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

    function nameChanged(event) {
        setName(event.target.value);
    }

    function imageChanged(event) {
        setImage(event.target.value);
    }

    function categoryChanged(event) {
        setCategory(event.target.value);
    }

    function glassChanged(event) {
        setGlass(event.target.value);
    }

    function garnishChanged(event) {
        setGarnish(event.target.value);
    }

    function preparationChanged(event) {
        setPreparation(event.target.value);
    }

    let imageListElement = null;
    if (!imageListStatus.completed) {
        imageListElement = (
            <p>Retrieving image options...</p>
        );
    } else if (imageListStatus.failed) {
        imageListElement = (
            <p>Failed to retrieve image options. Error details logged to console.</p>
        );
    } else {
        const imageOptions = imageList.map((image, i) => {
            return (
                <option key={"image-option-" + i} value={image}>{image}</option>
            );
        });

        imageListElement = (
            <select className="form-control mb-1" value={image} onChange={imageChanged}>
                {imageOptions}
            </select>
        );
    }

    let categoryListElement = null;
    if (!customCategory) {
        if (!categoryListStatus.completed) {
            categoryListElement = (
                <p>Retrieving category options...</p>
            );
        } else if (categoryListStatus.failed) {
            categoryListElement = (
                <p>Failed to retrieve category options. Error details logged to console.</p>
            );
        } else {
            const categoryOptions = categoryList.map((category, i) => {
                return (
                    <option key={"category-option-" + i} value={category}>{category}</option>
                );
            });

            categoryListElement = (
                <select className="form-control mb-1" value={category} onChange={categoryChanged}>
                    {categoryOptions}
                </select>
            );
        }
    } else {
        categoryListElement = (
            <input type="text" placeholder="Enter Category Here" className="form-control mb-1" value={category} onChange={categoryChanged} />
        );
    }

    let glassListElement = null;
    if (!customGlass) {
        if (!glassListStatus.completed) {
            glassListElement = (
                <p>Retrieving glass options...</p>
            );
        } else if (glassListStatus.failed) {
            glassListElement = (
                <p>Failed to retrieve glass options. Error details logged to console.</p>
            );
        } else {
            const glassOptions = glassList.map((glass, i) => {
                return (
                    <option key={"glass-option-" + i} value={glass}>{glass}</option>
                );
            });

            glassListElement = (
                <select className="form-control mb-1" value={glass} onChange={glassChanged}>
                    {glassOptions}
                </select>
            );
        }
    } else {
        glassListElement = (
            <input type="text" placeholder="Enter Glass Here" className="form-control mb-1" value={glass} onChange={glassChanged} />
        );
    }

    let garnishListElement = null;
    if (!customGarnish) {
        if (!garnishListStatus.completed) {
            garnishListElement = (
                <p>Retrieving garnish options...</p>
            );
        } else if (garnishListStatus.failed) {
            garnishListElement = (
                <p>Failed to retrieve garnish options. Error details logged to console.</p>
            );
        } else {
            const garnishOptions = garnishList.map((garnish, i) => {
                return (
                    <option key={"garnish-option-" + i} value={garnish}>{garnish}</option>
                );
            });

            garnishListElement = (
                <select className="form-control mb-1" value={garnish} onChange={garnishChanged}>
                    {garnishOptions}
                </select>
            );
        }
    } else {
        garnishListElement = (
            <input type="text" placeholder="Enter Garnish Here" className="form-control mb-1" value={garnish} onChange={garnishChanged} />
        );
    }

    return (
        <div className="recipe-detail-container">
            <h2>Properties</h2>
            <div className="form-group mb-3">
                <label htmlFor="name">Name</label>
                <input type="text" placeholder="Enter Name Here" className="form-control" value={name} onChange={nameChanged} />
            </div>

            <div className="form-group mb-3">
                <label htmlFor="image">Image (Choose One)</label>
                {imageListElement}
                <button className="btn btn-outline-secondary" onClick={imageListRefresh}>
                    Refresh Image Options
                </button>
            </div>

            <div className="form-group mb-3">
                <label htmlFor="category">Category</label>
                {categoryListElement}
                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={() => setCustomCategory(!customCategory)}>
                        {customCategory ? "Use Existing Category" : "Use Custom Category"}
                    </button>
                    {
                        customCategory ? null : (
                            <button className="btn btn-outline-secondary" onClick={categoryListRefresh}>
                                Refresh Category Options
                            </button>
                        )
                    }
                </div>
            </div>
            <div className="form-group mb-3">
                <label htmlFor="glass">Glass</label>
                {glassListElement}
                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={() => setCustomGlass(!customGlass)}>
                        {customGlass ? "Use Existing Glass" : "Use Custom Glass"}
                    </button>
                    {
                        customGlass ? null : (
                            <button className="btn btn-outline-secondary" onClick={glassListRefresh}>
                                Refresh Glass Options
                            </button>
                        )
                    }
                </div>
            </div>
            <div className="form-group mb-3">
                <label htmlFor="garnish">Garnish</label>
                {garnishListElement}
                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={() => setCustomGarnish(!customGarnish)}>
                        {customGarnish ? "Use Existing Garnish" : "Use Custom Garnish"}
                    </button>
                    {
                        customGarnish ? null : (
                            <button className="btn btn-outline-secondary" onClick={garnishListRefresh}>
                                Refresh Garnish Options
                            </button>
                        )
                    }
                </div>
            </div>

            <h2>Ingredients</h2>
            <IngredientEditList ingredients={ingredients} setIngredients={setIngredients} />

            <h2>Preparation Instructions</h2>
            <textarea ref={preparationTextBox} className="form-control mb-3" value={preparation} onChange={preparationChanged} />

            <div className="btns-hor">
                <button className="btn btn-outline-secondary" onClick={() => {
                    save();
                    props.exit();
                }}>
                    Save Changes
                </button>

                <button className="btn btn-outline-secondary" onClick={() => {
                    props.exit();
                }}>
                    Discard Changes
                </button>
            </div>
        </div>
    );
}

function IngredientEditList(props) {
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;

    function addIngredient() {
        setIngredients(ingredients.concat(IngredientData.createFromJSON({})));
    }

    function addSpecialIngredient() {
        setIngredients(ingredients.concat(SpecialIngredientData.createFromJSON({})));
    }

    function removeIngredient(index) {
        setIngredients(ingredients.filter((ingredient, i) => i !== index));
    }

    const ingredientElements = ingredients.map((ingredient, i) => {
        return (
            <div key={"ingredient-edit-" + i} className="ingredient-container mb-2">
                <h3>Ingredient {i + 1}</h3>

                <IngredientEdit
                    ingredient={ingredient}
                    removeIngredient={() => removeIngredient(i)}
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

    function nameChanged(event) {
        setName(event.target.value);
        ingredient.name = event.target.value;
    }

    function amountChanged(event) {
        setAmount(event.target.value);
        ingredient.amount = event.target.value;
    }

    function unitChanged(event) {
        setUnit(event.target.value);
        ingredient.unit = event.target.value;
    }

    function textChanged(event) {
        setText(event.target.value);
        ingredient.text = event.target.value;
    }

    if (!ingredient.isSpecial()) {
        return (
            <div className="ingredient-edit">
                <div className="form-group mb-1">
                    <label htmlFor="name">Name</label>
                    <input type="text" placeholder="Enter Name Here" className="form-control" value={name} onChange={nameChanged} />
                </div>
                <div className="form-group mb-1">
                    <label htmlFor="amount">Amount</label>
                    <input type="text" placeholder="Enter Amount Here" className="form-control" value={amount} onChange={amountChanged} />
                </div>
                <div className="form-group mb-1">
                    <label htmlFor="unit">Unit</label>
                    <input type="text" placeholder="Enter Unit Here" className="form-control" value={unit} onChange={unitChanged} />
                </div>
                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={removeIngredient}>
                        Remove Ingredient
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div className="ingredient-edit">
                <div className="form-group mb-1">
                    <label htmlFor="name">Text</label>
                    <input type="text" placeholder="Enter Text Here" className="form-control" value={text} onChange={textChanged} />
                </div>
                <div className="btns-hor">
                    <button className="btn btn-outline-secondary" onClick={removeIngredient}>
                        Remove Ingredient
                    </button>
                </div>
            </div>
        );
    }
}

export default RecipeDetailPage;