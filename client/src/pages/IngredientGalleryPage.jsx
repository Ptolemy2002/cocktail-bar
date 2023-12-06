import React, {useEffect} from "react";
import SearchBar from "src/components/SearchBar";
import Spacer from "src/components/Spacer";
import { useCurrentPath, useQuery } from "src/lib/Browser";
import { useApi } from "src/lib/Api";
import { Link } from "react-router-dom";

function IngredientGalleryPage() {
    document.title = "Ingredient Gallery | Cocktail Bar";
    
    const currentPath = useCurrentPath();
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const matchWhole = queryParams.get("matchWhole") === "true";

    let path = "recipes/all/list-ingredient/distinct";
    const [ingredients, ingredientsStatus, sendIngredientsRequest] = useApi(path, true, (a, b) => a.localeCompare(b));

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
                let regex;
                if (matchWhole) {
                    regex = new RegExp(`^${query}$`, "i");
                } else {
                    regex = new RegExp(query, "i");
                }

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
    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">{props.name}</h5>
            </div>
        </div>
    );
}

export default IngredientGalleryPage;