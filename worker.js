import crawlQueue from './utils/queue.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Worker started');
console.log('Redis connection details:', {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD ? '****' : 'not set'
});

// Test Redis connection
crawlQueue.on('ready', () => {
    console.log('Redis connection successful!');
});

crawlQueue.on('error', (error) => {
    console.error('Redis connection error:', error);
    console.error('Connection details:', {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        hasPassword: !!process.env.REDIS_PASSWORD
    });
});

// Handle connection timeout
crawlQueue.on('stalled', (job) => {
    console.error('Job stalled:', job.id);
}); 