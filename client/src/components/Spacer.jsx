import React, {useState} from "react";

export default function Spacer(props) {
    const [height, setHeight] = useState(props.height || "1rem");
    
    return (
        <div className="spacer" style={{height: height}}></div>
    );
}