import React from "react";
import SearchBar from "src/components/SearchBar";
import Spacer from "src/components/Spacer";
import { useCurrentPath, useQuery } from "src/lib/Browser";
import { useApi } from "src/lib/Api";
import { Link } from "react-router-dom";
import { useCocktailData } from "src/lib/CocktailUtil";
import CocktailImage from "src/components/CocktailImage";
import { useMountEffect } from "src/lib/Misc";

const searchCategories = [
    {
        value: "general",
        text: "General Search",
        info: `
            "General Search" uses a smart text search algorithm that does not support the "Match Whole Prompt" option.
            In addition, results will be sorted by relevance, not alphabetically.
        `,
        matchWholeOverride: false
    },
    {
        value: "name",
        text: "By Name"
    },
    {
        value: "image",
        text: "By Image"
    },
    {
        value: "category",
        text: "By Category"
    },
    {
        value: "glass",
        text: "By Glass"
    },
    {
        value: "garnish",
        text: "By Garnish"
    },
    {
        value: "preparation",
        text: "By Preparation Instructions"
    },
    {
        value: "ingredient",
        text: "By Ingredient Name"
    },
    {
        value: "unit",
        text: "By Ingredient Unit"
    },
    {
        value: "amount",
        text: "By Ingredient Amount",
        info: `
            "Ingredient Amount" is a number, so you can only enter a number in the search bar and
            must match the whole prompt.
        `,
        matchWholeOverride: true,
        number: true
    }
];

function RecipeGalleryPage() {
    const currentPath = useCurrentPath();
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const category = queryParams.get("category");
    const matchWhole = queryParams.get("matchWhole") === "true";

    let path = "recipes/all/list-name/distinct";
    if (query && category) {
        if (category === "general") {
            path = `recipes/search/${encodeURIComponent(query)}/list-name/distinct`;
        } else {
            if (matchWhole) {
                path = `recipes/${category}-equals/${encodeURIComponent(query)}/list-name/distinct`;
            } else {
                path = `recipes/${category}-contains/${encodeURIComponent(query)}/list-name/distinct`;
            }
        }

        document.title = `Recipe search results for "${query}" | Cocktail Bar`;
    } else {
        document.title = "Recipe Gallery | Cocktail Bar";
    }

    const [cocktailNames, cocktailNamesStatus, sendCocktailNamesRequest] = useApi(path, true, (a, b) => {
        if (a.type === "search-result" && b.type === "search-result") {
            if (a._score !== b._score) {
                return b._score - a._score;
            } else {
                return a.value.localeCompare(b.value);
            }
        }

        return a.localeCompare(b);
    });

    function refresh() {
        sendCocktailNamesRequest({
            method: "GET"
        });
    }

    // Refresh the cocktail list on first load
    useMountEffect(refresh);

    if (!cocktailNamesStatus.completed) {
        return (
            <div className="RecipeGalleryPage container">
                <h2>Recipe Gallery</h2>
                <SearchBar id="gallery-search"
                    query={query} category={category} matchWhole={matchWhole}
                    destinationPath={currentPath} categories={searchCategories}
                />
                <Spacer />
                
                <p>Retrieving cocktails...</p>
            </div>
        );
    } else if (cocktailNamesStatus.failed) {
        return (
            <div className="RecipeGalleryPage container">
                <h2>Recipe Gallery</h2>
                <SearchBar id="gallery-search"
                    query={query} category={category} matchWhole={matchWhole}
                    destinationPath={currentPath} categories={searchCategories}
                />
                <Spacer />

                <p className="text-danger">Failed to retrieve cocktails. Error details logged to console.</p>
            </div>
        );
    } else {
        const cocktailCards = cocktailNames.map((name, i) => {
            if (name.type === "search-result") name = name.value;
            return (
                <div key={"col-" + i} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <CocktailCard key={name}
                        name={name}
                    />
                </div>
            );
        });

        return (
            <div className="RecipeGalleryPage container">
                <h1>Recipe Gallery</h1>
                <SearchBar id="gallery-search"
                    query={query} category={category} matchWhole={matchWhole}
                    destinationPath={currentPath} categories={searchCategories}
                />
                <Spacer />

                <p>{cocktailNames.length} result(s)</p>

                <button
                    className="btn btn-outline-secondary mb-3"
                    onClick={refresh}
                >
                    Refresh
                </button>

                <div className="card-container">
                    <div className="row g-3">
                        {cocktailCards}
                    </div>
                </div>
            </div>
        );
    }
}

function CocktailCard(props) {
    const data = useCocktailData(props.name);

    function refresh() {
        data.pull();
    }

    // If lastRequest is null, the pull has not been started yet, but will be soon
    if (data.pullInProgress() || data.lastRequest === null) {
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">{props.name}</h5>
                    <p className="card-text">
                        Retrieving recipe...
                    </p>
                </div>
            </div>
        );
    } else if (data.pullFailed()) {
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">{props.name}</h5>
                    <p className="card-text">
                        <span className="text-danger">Failed to retrieve recipe. Error details logged to console.</span>
                    </p>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={refresh}
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    } else {
        const altText = data.isPlaceholderImage() ? "Placeholder image" : `Image of a "${data.name}" cocktail`;

        return (
            <div className="card">
                <CocktailImage className="card-img-top" src={data.image} alt={altText} />

                <div className="card-body">
                    <h5 className="card-title">{data.name}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">{data.category}</h6>

                    <p className="card-text">
                        <b>Glass:</b> {data.glass} <br />
                        <b>Garnish:</b> {data.garnish} <br />
                        <b>Ingredient Count:</b> {data.ingredients.length}
                    </p>

                    <Link
                        key="view-recipe"
                        to={`/recipe/${data.name}`}
                        className="btn btn-outline-secondary"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        title="Click for the full recipe and to make edits"
                        role="button"
                    >
                        View Recipe
                    </Link>
                    <Spacer height="0.5rem" />
                    <button
                        className="btn btn-outline-secondary"
                        onClick={refresh}
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }
}

export default RecipeGalleryPage;