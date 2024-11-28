import winston from "winston"

const isDevelopment = process.env.NODE_ENV === "development"

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        isDevelopment ? winston.format.prettyPrint() : winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
    ],
})

export default logger