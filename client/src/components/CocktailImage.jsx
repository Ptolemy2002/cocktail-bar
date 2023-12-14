import React from "react";
import { useMountEffect } from "src/lib/Misc";

function CocktailImage(props) {
    const [imgPath, _setImgPath] = React.useState("");
    const [altText, setAltText] = React.useState(props.alt);

    function setImgPath(path) {
        if (path) {
            _setImgPath(path.startsWith("url-") ? path.substring(4) : "/assets/images/" + path);
        } else {
            _setImgPath("/assets/images/Shaker.jpg");
        }
    }

    // Initialize image path when component is first mounted
    useMountEffect(() => {
        setImgPath(props.src);
    });

    return (
        <img src={imgPath} alt={altText} className={props.className} />
    );
}

export default CocktailImage;