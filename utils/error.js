import * as logger from './loggingEngine.js';
import messages from './message.js'

export const invalidEndPoint = (request, response, next) => {
    const error = new Error('Invalid Endpoint!');
    error.statusCode = 404;
    throw error;
};

export const createError = (statusCode) => {
    const error = new Error(messages[statusCode]);
    error.statusCode = statusCode;
    return error;
};

export const makeErrorResponse = (error) => {
    const status = error.statusCode || 500;
    const message = error.message || 'Server Error';
    logger.default.error({error: {message}});
    return {status: false, code: status, message, data: {}};
};

export const validate = (parameters, requestBody) => {
    const response = [];
    parameters.forEach((param) => {
        if (
            !(param in requestBody) ||
            requestBody[param] == null ||
            requestBody[param].toString().toUpperCase() === 'NULL' ||
            requestBody[param].toString().length === 0
        ) {
            response.push(param);
        }
    });

    if (response.length !== 0) {
        throw {
            data: {missingParameters: response},
            message: 'Missing Parameters',
            serverStatus: 400,
            statusCode: 400
        };
    }

    return response;
};
