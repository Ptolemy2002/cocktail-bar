import { useState, useEffect } from "react";

function useApi(path, args={}) {
    const [data, setData] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState(null);

    const _onSuccess = args.onSuccess || null;
    function onSuccess(data) {
        setData(data);
        setCompleted(true);
        if (_onSuccess) _onSuccess(data);
    }

    const _onFailure = args.onFailure || null;
    function onFailure(err) {
        setFailed(true);
        setCompleted(true);
        setError(err);
        if (_onFailure) _onFailure(err);
    }

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
        fetch(`${root}/api/v1/${encodeURIComponent(path)}`)
            .then((res) => res.json())
            .catch((err) => {
                onFailure(err);
            })
            .then((data) => {
                if (!data || data._isError) {
                    onFailure(data);
                } else {
                    onSuccess(data);
                }
            });
    }, [path]);

    return [data, completed, failed, error];
}

export {useApi};