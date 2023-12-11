import React, {useEffect} from "react";
import SearchBar from "src/components/SearchBar";
import Spacer from "src/components/Spacer";
import { useCurrentPath, useQuery } from "src/lib/Browser";
import { useApi } from "src/lib/Api";
import { escapeRegex, transformRegex } from "src/lib/Regex";
import { Link } from "react-router-dom";

function IngredientGalleryPage() {
    const currentPath = useCurrentPath();
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const matchWhole = queryParams.get("matchWhole") === "true";

    let path = "recipes/all/list-ingredient/distinct";
    const [ingredients, ingredientsStatus, sendIngredientsRequest] = useApi(path, true, (a, b) => a.localeCompare(b));

    if (query) {
        document.title = `Ingredient search results for "${query}" | Cocktail Bar`;
    } else {
        document.title = "Ingredient Gallery | Cocktail Bar";
    }

    function refresh() {
        sendIngredientsRequest({
            method: "GET"
        });
    }

    // Refresh the ingredient list on first load
    useEffect(refresh, []);

    if (!ingredientsStatus.completed) {
        return (
            <div className="IngredientGalleryPage container">
                <h1>Ingredients Gallery</h1>
                <SearchBar id="gallery-search"
                    query={query} category="name" matchWhole={matchWhole}
                    destinationPath={currentPath}
                    staticCategory={true}
                    staticMatchWhole={true}
                />
                <Spacer />
                
                <p>Retrieving ingredients...</p>
            </div>
        );
    } else if (ingredientsStatus.failed) {
        return (
            <div className="IngredientGalleryPage container">
                <h1>Ingredient Gallery</h1>
                <SearchBar id="gallery-search"
                    query={query} category="name" matchWhole={matchWhole}
                    destinationPath={currentPath}
                    staticCategory={true}
                    staticMatchWhole={true}
                />

                <p className="text-danger">Failed to retrieve ingredients. Error details logged to console.</p>
            </div>
        );
    } else {
        const shownIngredients = ingredients.filter((ingredient) => {
            if (query) {
                let regex = transformRegex(escapeRegex(query), {
                    accentInsensitive: true,
                    caseInsensitive: true,
                    matchWhole: matchWhole
                });
                
                if (!regex.test(ingredient)) return false;
            }

            return true;
        });

        const ingredientCards = shownIngredients.map((ingredient, i) => {
            return (
                <div key={"col-" + i} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <IngredientCard key={"ingredient-" + i}
                        name={ingredient}
                    />
                </div>
            );
        });

        return (
            <div className="IngredientGalleryPage container">
                <h1>Ingredient Gallery</h1>
                <SearchBar id="gallery-search"
                    query={query} category="name" matchWhole={matchWhole}
                    destinationPath={currentPath}
                    staticCategory={true}
                />
                <Spacer />

                <p>{shownIngredients.length} result(s)</p>

                <button
                    className="btn btn-outline-secondary mb-3"
                    onClick={refresh}
                >
                    Refresh
                </button>

                <div className="card-container">
                    <div className="row g-3">
                        {ingredientCards}
                    </div>
                </div>
            </div>
        );
    }
}

function IngredientCard(props) {
    const [recipeNames, recipeNamesStatus, sendRecipeNamesRequest] = useApi(`recipes/ingredient-equals/${encodeURIComponent(props.name)}/list-name`, true);

    function refresh() {
        sendRecipeNamesRequest({
            method: "GET"
        });
    }

    useEffect(refresh, []);

    let ingredientNamesText;
    if (!recipeNamesStatus.completed) {
        ingredientNamesText = "Retrieving Recipes with this ingredient...";
    } else if (recipeNamesStatus.failed) {
        ingredientNamesText = "Failed to retrieve recipes with this ingredient. Error details logged to console.";
    } else {
        // List the first 3 by name
        let text = "";
        for (let i = 0; i < Math.min(3, recipeNames.length); i++) {
            if (i > 0) {
                if (i === recipeNames.length - 1) {
                    if (i === 1) {
                        text += " and ";
                    } else {
                        text += ", and ";
                    }
                } else {
                    text += ", ";
                }
            }
            text += `"${recipeNames[i]}"`;
        }

        // If the length is greater than 3, add an indicator that there are more
        if (recipeNames.length > 3) {
            text += ", and " + (recipeNames.length - 3) + " more";
        }

        ingredientNamesText = text;
    }

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">{props.name}</h5>

                <p className="card-text">
                    <b>Used in: </b>
                    {ingredientNamesText}
                </p>

                <Link
                    key="view-recipes"
                    to={`/recipe-gallery?query=${encodeURIComponent(props.name)}&category=ingredient&matchWhole=true`}
                    className="btn btn-outline-secondary"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Click for recipes that use this ingredient"
                    role="button"
                >
                    View Recipes
                </Link>
                <Spacer height="0.5rem" />
                <button className="btn btn-outline-secondary" onClick={refresh}>
                    Refresh
                </button>   
            </div>
        </div>
    );
}

export default IngredientGalleryPage;