import { useState, useEffect } from "react";

function useApi(path, args={}) {
    const [data, setData] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState(null);

    const delaySend = args.delaySend || false;

    const _onSuccess = args.onSuccess || null;
    function onSuccess(data) {
        setData(data);
        setCompleted(true);
        if (_onSuccess) _onSuccess(data);
    }

    const _onFailure = args.onFailure || null;
    function onFailure(err) {
        console.error(err);
        setData(null);
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

    let root = "http://localhost:8080";
    if (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) {
        root = process.env.REACT_APP_API_URL;
    }

    function sendRequest(localArgs={}) {
        setData(null);
        setCompleted(false);
        setFailed(false);
        setError(null);

        const localOptions = {...(options || {})};
        let localPath = path;
        if (localArgs.body) {
            if (!localOptions.body) localOptions.body = "{}";
            localOptions.body = JSON.parse(localOptions.body);

            Object.keys(localArgs.body).forEach((key) => {
                localOptions.body[key] = localArgs.body[key];
            });
            localOptions.body = JSON.stringify(localOptions.body);
            localOptions.headers = {
                "Content-Type": "application/json"
            };
        }

        let localQueryParams = queryParams;
        if (localArgs.queryParams) {
            if (!localQueryParams) localQueryParams = {};
            Object.keys(localArgs.queryParams).forEach((key) => {
                localQueryParams[key] = localArgs.queryParams[key];
            });
        }

        if (localQueryParams) {
            const queryString = Object.keys(localQueryParams)
                .map((key) => `${encodeURIComponent(key.toString())}=${encodeURIComponent(queryParams[key].toString())}`)
                .join("&");
            localPath = `${localPath}?${queryString}`;
        }
        
        fetch(`${root}/api/v1/${localPath}`, localOptions)
            .then((res) => res.json())
            .catch((err) => {
                onFailure(err);
                if (localArgs.onFailure) localArgs.onFailure(err);
            })
            .then((data) => {
                if (!data || data._isError) {
                    onFailure(data);
                    if (localArgs.onFailure) localArgs.onFailure(data);
                } else {
                    onSuccess(data);
                    if (localArgs.onSuccess) localArgs.onSuccess(data);
                }
            });
    }

    useEffect(() => {
        if (!delaySend) {
            sendRequest();
        }
    }, []);

    return [data, {completed, failed, error}, sendRequest];
}

export {useApi};