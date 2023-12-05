import React, {useEffect} from "react";
import SearchBar from "src/components/SearchBar";
import Spacer from "src/components/Spacer";
import { useQuery } from "src/lib/Browser";
import { useApi } from "src/lib/Api";
import { Link } from "react-router-dom";
import { CocktailData } from "src/lib/CocktailUtil";
import CocktailImage from "src/components/CocktailImage";

function RecipeGalleryPage() {
    document.title = "Recipe Gallery | Cocktail Bar";
    
    const queryParams = useQuery();
    const query = queryParams.get("query");
    const category = queryParams.get("category");
    const matchWhole = queryParams.get("matchWhole");

    let path = "recipes/all";
    if (query && category) {
        if (category === "general") {
            if (matchWhole) {
                path = `recipes/search-whole/${encodeURIComponent(query)}`;
            } else {
                path = `recipes/search/${encodeURIComponent(query)}`;
            }
        } else {
            if (matchWhole) {
                path = `recipes/${category}-equals/${query}`;
            } else {
                path = `recipes/${category}-contains/${query}`;
            }
        }
    }

    const [cocktails, cocktailsStatus, sendCocktailRequest] = useApi(path, true, (a, b) => a.name.localeCompare(b.name));

    function refresh() {
        sendCocktailRequest({
            method: "GET",
        });
    }

    // Refresh the cocktail list on first load
    useEffect(refresh, []);

    if (!cocktailsStatus.completed) {
        return (
            <div className="GalleryPage container">
                <h2>Gallery</h2>
                <p>Retrieving cocktails...</p>
            </div>
        );
    } else if (cocktailsStatus.failed) {
        return (
            <div className="GalleryPage container">
                <h2>Gallery</h2>
                <p className="text-danger">Failed to retrieve cocktails. Error details logged to console.</p>
            </div>
        );
    } else {
        const cocktailCards = cocktails.map((cocktail, i) => {
            return (
                <div key={"col-" + i} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <CocktailCard key={cocktail.name}
                        cocktailData={CocktailData.createFromJSON(cocktail)}
                    />
                </div>
            );
        });

        return (
            <div className="GalleryPage container">
                <h1>Gallery</h1>
                <SearchBar id="gallery-search" query={query} category={category} matchWhole={matchWhole} />
                <Spacer />
                <p>{cocktails.length} result(s)</p>

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
    const data = props.cocktailData;
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
            </div>
        </div>
    );
}

export default RecipeGalleryPage;