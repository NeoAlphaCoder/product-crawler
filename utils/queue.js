import Queue from 'bull';
import { crawlDomain } from '../controllers/crawlers/product.js';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection to Redis queue
const crawlQueue = new Queue('crawl', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        tls: {
            rejectUnauthorized: false
        }
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});

// Process jobs in the queue
crawlQueue.process(async (job) => {
    const { domain } = job.data;
    try {
        const urls = await crawlDomain(domain);
        return {
            domain,
            status: 'success',
            urlsFound: urls.length
        };
    } catch (error) {
        console.error(`Error processing ${domain}:`, error);
        throw error;
    }
});

// Handle queue events
crawlQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

crawlQueue.on('waiting', (jobId) => {
    console.log(`Job ${jobId} is waiting`);
});

crawlQueue.on('active', (job) => {
    console.log(`Job ${job.id} is active`);
});

crawlQueue.on('completed', (job) => {
    console.log(`Job ${job.id} is completed`);
});

crawlQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
});

export default crawlQueue;
