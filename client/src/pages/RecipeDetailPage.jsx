import React, {useState} from "react";
import { useApi } from "src/lib/Api";
import { useParams } from "react-router-dom";
import { CocktailData } from "src/lib/CocktailUtil";

function RecipeDetailPage() {
    const { name } = useParams();
    const [cocktailData, setCocktailData] = useState(null);
    const [pushStarted, setPushStarted] = useState(false);

    const [pullResult, pullStatus, refresh] = useApi("recipes/name-equals/" + encodeURIComponent(name), {
        onFailure: console.error,
        onSuccess: (result) => {
            setCocktailData(CocktailData.createFromJSON(result[0]));
        }
    });

    const [pushResult, pushStatus, _push] = useApi("recipes/update/by-id/" + encodeURIComponent(cocktailData?.id), {
        method: "POST",
        body: cocktailData,
        // This prevvents immediately sending the request - Use the push() function instead
        delaySend: true,
        onFailure: (err) => {
            console.error(err);
            setPushStarted(false);
        },
        onSuccess: () => {
            refresh();
            setPushStarted(false);
        }
    });

    function push() {
        setPushStarted(true);
        _push();
    }

    document.title = `${name} | Cocktail Bar`;

    if (!pullStatus.completed) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Retrieving cocktail data...</p>
            </div>
        );
    } else if (pullStatus.failed) {
        return (
            <div className="RecipeDetailPage container">
                <h1>{name}</h1>
                <p>Failed to retrieve cocktail data. Error details logged to console.</p>
            </div>
        );
    } else {
        let pushInfoElement = null;

        if (pushStarted) {
            if (!pushStatus.completed) {
                pushInfoElement = (
                    <p className="text-info">Updating cocktail data...</p>
                );
            } else if (pushStatus.failed) {
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