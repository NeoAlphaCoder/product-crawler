import logger from './loggingEngine.js';
import messages from './message.js';

const responseHandler = (
    request,
    response,
    next,
    serverStatus = 200,
    status,
    messageCode,
    data
) => {
    logger.info({
        messageCode,
        message: messages[messageCode],
        data,
        serverStatus,
        dateTime: new Date()
    });

    response.status(200).json({
        status,
        code: messageCode,
        message: messages[messageCode],
        data
    });
};

export default responseHandler;