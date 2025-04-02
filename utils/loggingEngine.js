import winston from "winston";
const date = new Date();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            format: winston.format.colorize(),
            filename: `public/logs/${date.getDate()}-${date.getMonth() + 1}/infolog.log`,
            level: 'info'
        }),
        new winston.transports.File({
            format: winston.format.colorize(),
            filename: `public/logs/${date.getDate()}-${date.getMonth() + 1}/errorlog.log`,
            level: 'error'
        })
    ]
});

export default logger;