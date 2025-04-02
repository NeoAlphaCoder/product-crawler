import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();

import * as errorHandler from './utils/error.js';
import sequelize, { initializeDatabase } from './utils/database.js';
import ProductURL from './models/productUrl.js';
import * as productRoutes from './routes/crawler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// CORS headers
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE'
    );
    response.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, AuthorizationToken'
    );
    next();
});

// Health check endpoint
app.get('/ping', function (req, res) {
    res.send('Hello World!');
});

// Routes
app.use('/crawler', productRoutes.default);

// Error handling
app.use(errorHandler.invalidEndPoint);
app.use((error, request, response, next) => {
    return response
        .status(error.serverStatus || 250)
        .json(errorHandler.makeErrorResponse(error));
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase([ProductURL]);
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

