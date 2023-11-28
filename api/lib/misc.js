function sendResponse(res, data, args={}) {
	if (data._isError) {
		res.status(args.errorStatus || 500).json(data);
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