import React, {useEffect, useState} from "react";
import { useApi } from "src/lib/Api";
import { useParams } from "react-router-dom";
import { CocktailData } from "src/lib/CocktailUtil";

function RecipeDetailPage() {
    const { name } = useParams();
    const [firstPull, setFirstPull] = useState(true);

    document.title = `${name} | Cocktail Bar`;

    const [pullResult, pullStatus, _pull] = useApi("recipes/name-equals/" + encodeURIComponent(name), {
        // This prevents immediately sending the request - Use the pull() function instead
        delaySend: true,
        onSuccess: () => {
            if (firstPull) {
                setFirstPull(false);
            }
        },

        onFailure: () => {
            if (firstPull) {
                setFirstPull(false);
            }
        }
    });

    const [pushResult, pushStatus, _push] = useApi("recipes/update/by-name/" + encodeURIComponent(name), {
        method: "POST",
        // This prevents immediately sending the request - Use the push() function instead
        delaySend: true
    });

    const [cocktailData] = useState(CocktailData.createFromJSON({name: name}, _push, _pull));

    // Pull the cocktail data when the component is first mounted
    useEffect(() => {
        cocktailData.pull();
    }, []);

    // The use of firstPull here is necessary because the useEffect() hook is called after the first render and lastRequest is initially null.
    // Thus, the first render would show the main section of the page when it should show the loading message.
    if ((cocktailData.lastRequest === "pull" && cocktailData.requestInProgress) || firstPull) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Retrieving cocktail data...</p>
            </div>
        );
    } else if (cocktailData.lastRequest === "pull" && cocktailData.requestFailed) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Failed to retrieve cocktail data. Error details logged to console.</p>
            </div>
        );
    } else {
        let pushInfoElement = null;

        if (cocktailData.lastRequest === "push") {
            if (cocktailData.requestInProgress) {
                pushInfoElement = (
                    <p className="text-info">Updating cocktail data...</p>
                );
            } else if (cocktailData.requestFailed) {
                pushInfoElement = (
                    <p className="text-danger">Failed to update cocktail data. Error details logged to console.</p>
                );
            }
        }

        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                {pushInfoElement}
                <RecipeDetailDisplay cocktailData={cocktailData} />
            </div>
        );
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

export default RecipeDetailPage;