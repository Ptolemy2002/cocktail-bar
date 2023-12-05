import React, {useState} from "react";

function Spacer(props) {
    const [height, setHeight] = useState(props.height || "1rem");
    
    return (
        <div className="spacer" style={{height: height}}></div>
    );
}

export default Spacer;