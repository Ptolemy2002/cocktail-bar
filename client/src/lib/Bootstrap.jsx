import React from "react";
import { combineClassNames } from "src/lib/Misc";

function BootstrapCard(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card")
    };

    return (
        <div {...newProps}>
            {props.children}
        </div>
    );
}

function BootstrapCardBody(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-body")
    };

    return (
        <div {...newProps}>
            {props.children}
        </div>
    );
}

function BootstrapCardTitle(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-title"),
        // hLevel is a prop that will be handled by us, not passed to the <h> tag
        hLevel: undefined
    };

    // For some reason, eslint doesn't recognize that hTag is used in the return statement
    const hTag = `h${props.hLevel || 5}`; //eslint-disable-line no-unused-vars
    return (
        <hTag {...newProps}>
            {props.children}
        </hTag>
    );
}

function BootstapCardSubtitle(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-subtitle"),
        // hLevel is a prop that will be handled by us, not passed to the <h> tag
        hLevel: undefined
    };

    // For some reason, eslint doesn't recognize that hTag is used in the return statement
    const hTag = `h${props.hLevel || 6}`; //eslint-disable-line no-unused-vars
    return (
        <hTag {...newProps}>
            {props.children}
        </hTag>
    );
}

function BootstrapCardText(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-text")
    };

    return (
        <p {...newProps}>
            {props.children}
        </p>
    );
}

function BootstrapCardImage(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-img-" + props.position),
        // position is a prop that will be handled by us, not passed to the <img> tag
        position: undefined
    };

    // alt text will likely be provided in the props, so I'm dismissing the eslint warning
    return (
        <img {...newProps} /> // eslint-disable-line jsx-a11y/alt-text
    );
}

// This is done so that we can import only the BootstrapCard component and still have access to the other related components
BootstrapCard.Body = BootstrapCardBody;
BootstrapCard.Title = BootstrapCardTitle;
BootstrapCard.Subtitle = BootstapCardSubtitle;
BootstrapCard.Text = BootstrapCardText;
BootstrapCard.Image = BootstrapCardImage;

export { BootstrapCard };