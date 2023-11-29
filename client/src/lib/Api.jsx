import { useState, useEffect } from "react";

function useApi(path, args={}) {
    const [data, setData] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState(null);

    const onSuccess = args.onSuccess || null;
    const onFailure = args.onFailure || null;
    const method = args.method || "GET";
    const queryParams = args.queryParams || null;
    const body = (
        args.body === null || args.body === undefined ?
            null:
        typeof args.body !== "string" ?
            JSON.stringify(args.body): 
        //else
            args.body
    );

    const options = {method: method}
    if (body) {
        options.body = body;
    }

    if (queryParams) {
        const queryString = Object.keys(queryParams)
            .map((key) => `${encodeURIComponent(key.toString())}=${encodeURIComponent(queryParams[key].toString())}`)
            .join("&");
        path = `${path}?${queryString}`;
    }

    let root = "http://localhost:8080";

    if (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) {
        root = process.env.REACT_APP_API_URL;
    }

    useEffect(() => {
        fetch(`${root}/api/v1/${path}`)
            .then((res) => res.json())
            .catch((err) => {
                setFailed(true);
                setCompleted(true);
                setError(err);
                if (onFailure) onFailure(err);
            })
            .then((data) => {
                setData(data);
                setCompleted(true);
                if (onSuccess) onSuccess(data);
            });
    }, [path]);

    return [data, completed, failed, error];
}

export {useApi};