import React from "react";
import { useMountEffect } from "src/lib/Misc";
import BootstrapCard from "src/lib/Bootstrap/Card";

export default function CocktailImage(props) {
    const [imgPath, _setImgPath] = React.useState("");

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

    const newProps = {
        ...props
    };
    // Delete props will be handled by us, not passed to the <img> tag
    delete newProps.src;
    delete newProps.isCardImage;

    if (props.isCardImage) {
        // alt text will likely be provided in the props, so I'm dismissing the eslint warning
        return (
            <BootstrapCard.Image {...newProps} src={imgPath} /> // eslint-disable-line jsx-a11y/alt-text
        );
    } else {
        // alt text will likely be provided in the props, so I'm dismissing the eslint warning
        return (
            <img {...newProps} src={imgPath} /> // eslint-disable-line jsx-a11y/alt-text
        );
    }
}