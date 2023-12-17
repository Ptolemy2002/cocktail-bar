import React, {useState} from "react";

export default function SearchBar(props) {
    const [query, setQuery] = useState(props.query || "");
    const [category, setCategory] = useState(props.category || "general");
    const [matchWhole, setMatchWhole] = useState(props.matchWhole || false);

    const infoMap = {};
    const matchWholeOverrideMap = {};
    const numberMap = {};

    function handleQueryChange(event) {
        if (numberMap[category] && isNaN(event.target.value)) return;
        setQuery(event.target.value);
    }

    function handleCategoryChange(event) {
        setCategory(event.target.value);
        if (event.target.value === "amount") {
            setMatchWhole(true);
        } else if (event.target.value === "general") {
            setMatchWhole(false);
        }
    }

    function handleMatchWholeChange(event) {
        if (matchWholeOverrideMap[category] && event.target.checked !== !!matchWholeOverrideMap[category]) return;
        setMatchWhole(event.target.checked);
    }

    function redirect() {
        let href = props.destinationPath + "?";
        if (query) {
            href += `query=${encodeURIComponent(query.trim())}&`;
        }
        if (category) {
            href += `category=${encodeURIComponent(category)}&`;
        }
        if (matchWhole) {
            href += `matchWhole=${encodeURIComponent(matchWhole)}`;
        }

        href = href.replace(/&$/, "");
        window.location.href = href;
    }

    function handleKeyUp(event) {
        if (event.key === "Enter") {
            redirect();
        }
    }

    const optionElements = (props.categories || []).map((o) => {
        if (o.hasOwnProperty("info")) {
            infoMap[o.value] = o.info;
        }

        if (o.hasOwnProperty("matchWholeOverride")) {
            matchWholeOverrideMap[o.value] = o.matchWholeOverride;
        }

        if (o.hasOwnProperty("number")) {
            numberMap[o.value] = o.number;
        }

        return (
            <option key={o.value} value={o.value}>{o.text}</option>
        );
    });

    return (
        <div className="search-bar input-group">
            {
                infoMap.hasOwnProperty(category) ? (
                    <p>
                        {infoMap[category]}
                    </p>
                ):
                // Else
                null
            }
            <div className="form-outline">
                <input 
                    type="search"
                    id={props.id}
                    className="form-control"
                    placeholder="Search"
                    value={query}
                    onChange={handleQueryChange}
                    onKeyUp={handleKeyUp}
                />

                <div className="search-bar-options">
                    {
                        props.staticCategory ? null : (
                            <select
                                className="form-select"
                                value={category}
                                onChange={handleCategoryChange}
                            >
                                {optionElements}
                            </select>
                        )
                    }

                    {
                        (!props.staticMatchWhole && !matchWholeOverrideMap.hasOwnProperty(category)) ? (
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
                        ):
                        // Else
                        null
                    }
                </div>
            </div>

            <button className="search-btn btn btn-primary" onClick={redirect}>
                <i className="fas fa-search"></i>
            </button>
        </div>
    );
}