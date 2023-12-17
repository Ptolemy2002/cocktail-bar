import React from "react";
import SearchBar from "src/components/SearchBar";
import Spacer from "src/components/Spacer";
import { useQuery } from "src/lib/Browser";
import { useApi } from "src/lib/Api";
import { escapeRegex, transformRegex } from "src/lib/Regex";
import { Link } from "react-router-dom";
import { listInPlainEnglish, useMountEffect } from "src/lib/Misc";
import BootstrapCard from "src/lib/Bootstrap/Card";

export default function QueryWrapper() {
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const matchWhole = queryParams.get("matchWhole") === "true";

    return (
        <IngredientGalleryPage
            query={query}
            matchWhole={matchWhole}
        />
    );
}

export function IngredientGalleryPage(props) {
    const [ingredients, ingredientsStatus, sendIngredientsRequest] = useApi("recipes/all/list-ingredient/distinct", true, (a, b) => a.localeCompare(b));

    if (props.query) {
        document.title = `Ingredient search results for "${props.query}" | Cocktail Bar`;
    } else {
        document.title = "Ingredient Gallery | Cocktail Bar";
    }

    function refresh() {
        sendIngredientsRequest({
            method: "GET"
        });
    }

    // Refresh the ingredient list on first load
    useMountEffect(refresh);

    const searchBarElement = (
        <SearchBar id="gallery-search"
            query={props.query} category="name" matchWhole={props.matchWhole}
            destinationPath="/ingredient-gallery"
            staticCategory={true}
        />
    );

    if (!ingredientsStatus.completed) {
        return (
            <div className="IngredientGalleryPage container">
                <h1>Ingredients Gallery</h1>
                {searchBarElement}
                <Spacer />
                
                <p>Retrieving ingredients...</p>
            </div>
        );
    } else if (ingredientsStatus.failed) {
        return (
            <div className="IngredientGalleryPage container">
                <h1>Ingredient Gallery</h1>
                {searchBarElement}
                <Spacer />

                <p className="text-danger">Failed to retrieve ingredients. Error details logged to console.</p>
            </div>
        );
    } else {
        const shownIngredients = ingredients.filter((ingredient) => {
            if (props.query) {
                let regex = transformRegex(escapeRegex(props.query), {
                    accentInsensitive: true,
                    caseInsensitive: true,
                    matchWhole: props.matchWhole
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
                {searchBarElement}
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

export function IngredientCard(props) {
    const [recipeNames, recipeNamesStatus, sendRecipeNamesRequest] =
        useApi(`recipes/ingredient-equals/${encodeURIComponent(props.name)}/list-name`, true);

    function refresh() {
        sendRecipeNamesRequest({
            method: "GET"
        });
    }

    useMountEffect(refresh);

    let ingredientNamesText;
    if (!recipeNamesStatus.completed) {
        ingredientNamesText = "Retrieving Recipes with this ingredient...";
    } else if (recipeNamesStatus.failed) {
        ingredientNamesText = "Failed to retrieve recipes with this ingredient. Error details logged to console.";
    } else {
        ingredientNamesText = listInPlainEnglish(recipeNames.map((v) => `"${v}"`), 3);
    }

    return (
        <BootstrapCard>
            <BootstrapCard.Body>
                <BootstrapCard.Title hLevel={5}>{props.name}</BootstrapCard.Title>

                <BootstrapCard.Text>
                    <b>Used in: </b>
                    {ingredientNamesText}
                </BootstrapCard.Text>

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
            </BootstrapCard.Body>
        </BootstrapCard>
    );
}