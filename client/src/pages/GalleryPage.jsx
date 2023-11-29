import React from "react";
import { useApi } from "src/lib/Api";
import { Link } from "react-router-dom";

function GalleryPage() {
    const [cocktails, cocktailsCompleted, cocktailsFailed] = useApi("recipes/all", {
        onFailure: console.error
    });

    if (!cocktailsCompleted) {
        return (
            <div className="GalleryPage container">
                <h2>Gallery</h2>
                <p>Retrieving cocktails...</p>
            </div>
        );
    } else if (cocktailsFailed) {
        return (
            <div className="GalleryPage container">
                <h2>Gallery</h2>
                <p>Failed to retrieve cocktails. Error details logged to console.</p>
            </div>
        );
    } else {
        const cocktailCards = cocktails.map((cocktail, i) => {
            return (
                <div key={"col-" + i} className="col col-12 col-md-6 col-lg-4 col-xl-3">
                    <CocktailCard
                        cocktailData={cocktail}
                    />
                </div>
            );
        });

        return (
            <div className="GalleryPage container">
                <h1>Gallery</h1>
                <p>{cocktails.length} result(s)</p>

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
    const [image, _setImage] = React.useState(props.cocktailData.image || "Shaker.png");
    const [name, _setName] = React.useState(props.cocktailData.name || "Unknown Cocktail");
    const [category, _setCategory] = React.useState(props.cocktailData.category || "Unknown Category");
    const [glass, _setGlass] = React.useState(props.cocktailData.glass || "Unknown");
    const [garnish, _setGarnish] = React.useState(props.cocktailData.garnish || "None");
    const [ingredients, _setIngredients] = React.useState(props.cocktailData.ingredients || []);

    function isPlaceholderImage(image) {
        return image === "Shaker.png";
    }

    const altText = isPlaceholderImage() ? "Placeholder image" : `Image of ${name}`;


    return (
        <div className="card">
            <img className="card-img-top" src={`assets/images/${image}`} alt={altText}></img>

            <div className="card-body">
                <h5 className="card-title">{name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{category}</h6>

                <p className="card-text">
                    <b>Glass:</b> {glass} <br />
                    <b>Garnish:</b> {garnish} <br />
                    <b>Ingredient Count:</b> {ingredients.length}
                </p>

                <Link 
                    to="#"
                    className="btn btn-outline-secondary"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Click for more info"
                    role="button"
                >View Recipe</Link>
            </div>
        </div>
    );
}

export default GalleryPage;