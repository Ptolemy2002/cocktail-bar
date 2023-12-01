function sendResponse(res, data, args={}) {
	if (!data || data._isError) {
        const status = args.errorStatus || (data.type === "TypeError" ? 400 : 500);
		res.status(status).json(data);
	} else {
		res.status(args.status || 200).json(data);
	}
}

function errorResponse(err) {
    return {
        _isError: true,
        type: err.name,
        message: err.message
    }
}

module.exports = {
    sendResponse,
	errorResponse
}