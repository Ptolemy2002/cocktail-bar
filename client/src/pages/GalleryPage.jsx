import React from "react";
import { useApi } from "src/lib/Api";
import { Link } from "react-router-dom";

function GalleryPage() {
    const [cocktails, cocktailsCompleted, cocktailsFailed] = useApi("recipes/all", {
        onFailure: console.error
    });

    if (!cocktailsCompleted) {
        return (
            <div className="GalleryPage">
                <h2>Gallery</h2>
                <p>Retrieving cocktails...</p>
            </div>
        );
    } else if (cocktailsFailed) {
        return (
            <div className="GalleryPage">
                <h2>Gallery</h2>
                <p>Failed to retrieve cocktails. Error details logged to console.</p>
            </div>
        );
    } else {
        const cocktailCards = cocktails.map((cocktail) => {
            return (
                <div key={cocktail.id} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <CocktailCard
                        cocktailData={cocktail}
                    />
                </div>
            );
        });
        return (
            <div className="GalleryPage">
                <h1>Gallery</h1>

                <div className="container card-container">
                    <div className="row g-3">
                        {cocktailCards}
                    </div>
                </div>
            </div>
        );
    }
}

function CocktailCard(props) {
    return (
        <div className="card">
            <img className="card-img-top" src="https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" alt="Placeholder Image"></img>

            <div className="card-body">
                <h5 className="card-title">{props.cocktailData.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">{props.cocktailData.category || "Unknown Category"}</h6>

                <p className="card-text">
                    Placeholder
                </p>

                <Link 
                    to="states/alabama/index.html"
                    className="btn btn-outline-secondary"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Click for more info"
                    role="button"
                >View Details</Link>
            </div>
        </div>
    );
}

export default GalleryPage;