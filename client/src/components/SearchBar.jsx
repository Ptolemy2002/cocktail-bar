import React, {useState} from "react";

function SearchBar(props) {
    const [query, setQuery] = useState(props.query || "");
    const [category, setCategory] = useState(props.category || "general");
    const [matchWhole, setMatchWhole] = useState(props.matchWhole ? props.matchWhole === "true" : false);

    function handleQueryChange(event) {
        setQuery(event.target.value);
    }

    function handleCategoryChange(event) {
        setCategory(event.target.value);
    }

    function handleMatchWholeChange(event) {
        setMatchWhole(event.target.checked);
    }

    function redirect() {
        window.location.href = "/recipe-gallery?query=" + query + "&category=" + category + "&matchWhole=" + matchWhole;
    }

    return (
        <div className="search-bar input-group">
            <div className="form-outline">
                <input 
                    type="search"
                    id={props.id}
                    className="form-control"
                    placeholder="Search"
                    value={query}
                    onChange={handleQueryChange}
                />

                <div className="search-bar-options">
                    <select
                        className="form-select"
                        value={category}
                        onChange={handleCategoryChange}
                    >
                        <option value="general">General Search</option>
                        <option value="name">By Name</option>
                        <option value="image">By Image</option>
                        <option value="category">By Category</option>
                        <option value="glass">By Glass</option>
                        <option value="garnish">By Garnish</option>
                        <option value="preparation">By Preparation Instructions</option>
                        <option value="ingredient">By Ingredient Name</option>
                        <option value="unit">By Ingredient Unit</option>
                        <option value="amount">By Ingredient Amount</option>
                        <option value="label">By Ingredient Label</option>
                        <option value="special">By Special Ingredient</option>
                    </select>

                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="match-whole"
                            checked={matchWhole}
                            onChange={handleMatchWholeChange}
                        />
                        <label className="form-check-label" htmlFor="match-whole">Match Whole Prompt</label>
                    </div>
                </div>
            </div>

            <button className="search-btn btn btn-primary" onClick={redirect}>
                <i className="fas fa-search"></i>
            </button>
        </div>
    );
}

export default SearchBar;