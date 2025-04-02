import apiResponder from '../../utils/responder.js';
import { validate } from '../../utils/error.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import ProductURL from '../../models/productUrl.js';
import puppeteer from 'puppeteer';
import crawlQueue from '../../utils/queue.js';

export const productCrawler = async (request, response, next) => {
    try {
        validate(['urls'], request.body);
        const crawlUrls = request.body.urls;
        console.log("Starting crawl for URLs:", crawlUrls);
        
        // Add each domain to the queue
        const jobs = await Promise.all(
            crawlUrls.map(domain => 
                crawlQueue.add({ domain })
            )
        );

        // Return immediately with job IDs
        return apiResponder(request, response, next, 200, true, 2000, {
            message: 'Crawling jobs queued successfully',
            totalJobs: jobs.length,
            jobIds: jobs.map(job => job.id)
        });
    } catch (error) {
        next(error);
    }
};

// Export the crawling function for queue processing
export const crawlDomain = async (domain, visited = new Set(), depth = 2) => {
    if (depth === 0 || visited.has(domain)) {
        return [];
    }

    visited.add(domain);
    console.log(`Crawling: ${domain}`);

    try {
        // Try Puppeteer first for JavaScript-rendered content
        let content = await fetchWithPuppeteer(domain);
        
        // If Puppeteer fails, try Axios
        if (!content) {
            content = await fetchWithAxios(domain);
        }

        if (!content) {
            console.log(`Failed to fetch content for ${domain}`);
            return [];
        }

        const $ = cheerio.load(content);
        const productURLs = new Set();
        const internalLinks = new Set();
        const baseUrl = new URL(domain).origin;

        // Simplified product URL patterns
        const productPatterns = [
            /\/products?\/[^\/]+/i,
            /\/items?\/[^\/]+/i,
            /\/p(?:-|\d+)/i,
            /\/shop\/[^\/]+/i,
            /\/catalog\/[^\/]+/i,
            /\/detail\/[^\/]+/i,
            /\/buy\/[^\/]+/i,
            /\/item\/[^\/]+/i,
            /\/product-detail\/[^\/]+/i,
            /\/fashion\/[^\/]+/i,
            /\/clothing\/[^\/]+/i,
            /\/accessories\/[^\/]+/i,
            /\/p\/[^\/]+/i,
            /\/makeup\/[^\/]+/i,
            /\/skincare\/[^\/]+/i
        ];

        // Look for product URLs in links
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                try {
                    const absoluteURL = new URL(href, baseUrl).href;
                    
                    // Check if URL matches any product pattern
                    if (productPatterns.some(pattern => pattern.test(absoluteURL))) {
                        productURLs.add(absoluteURL);
                    } else if (absoluteURL.startsWith(baseUrl) && !visited.has(absoluteURL)) {
                        internalLinks.add(absoluteURL);
                    }
                } catch (urlError) {
                    console.error(`Invalid URL found: ${href} on ${domain}`, urlError);
                }
            }
        });

        // Look for product URLs in data attributes
        $('[data-product-id], [data-item-id], [data-sku]').each((_, element) => {
            const productUrl = $(element).closest('a').attr('href');
            if (productUrl) {
                try {
                    const absoluteURL = new URL(productUrl, baseUrl).href;
                    productURLs.add(absoluteURL);
                } catch (urlError) {
                    console.error(`Invalid product URL found in data attribute: ${productUrl}`, urlError);
                }
            }
        });

        // Recursively crawl internal links
        for (const link of internalLinks) {
            const deeperProductURLs = await crawlDomain(link, visited, depth - 1);
            deeperProductURLs.forEach(url => productURLs.add(url));
        }

        const urls = Array.from(productURLs);
        
        // Store URLs in database
        if (urls.length > 0) {
            await storeURLs(domain, urls);
        }

        return urls;
    } catch (error) {
        console.error(`Error fetching ${domain}:`, error.message);
        return [];
    }
};

async function storeURLs(domain, urls) {
    try {
        // Check if domain already exists
        const existingRecord = await ProductURL.findOne({ where: { domain } });
        
        if (existingRecord) {
            // Update existing record with new URLs
            await existingRecord.update({ 
                urls: urls,
                crawlingDate: new Date()
            });
            console.log(`Updated URLs for ${domain}`);
        } else {
            // Create new record
            await ProductURL.create({ 
                domain, 
                urls: urls,
                crawlingDate: new Date()
            });
            console.log(`Stored URLs for ${domain}`);
        }
        
        console.log(`Total URLs stored for ${domain}: ${urls.length}`);
    } catch (error) {
        console.error(`Error storing URLs for ${domain}:`, error.message);
    }
}

async function fetchWithPuppeteer(domain) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(), // Use Puppeteer's installed Chrome
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Render environments
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
        await page.goto(domain, { waitUntil: 'networkidle2', timeout: 30000 });
        const content = await page.content();
        await browser.close();
        return content;
    } catch (error) {
        console.error(`Puppeteer failed for ${domain}:`, error.message);
        await browser.close();
        return null;
    }
}

async function fetchWithAxios(domain) {
    try {
        const { data } = await axios.get(domain, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Check if the response has content
        if (data.trim().length < 500) {
            console.log(`Axios detected an empty or JS-rendered page on ${domain}`);
            return null; // Signal to switch to Puppeteer
        }
        return data;
    } catch (error) {
        console.error(`Axios failed for ${domain}:`, error.message);
        return null;
    }
}

export const checkJobStatus = async (request, response, next) => {
    try {
        validate(['jobId'], request.query);
        const { jobId } = request.query;

        const job = await crawlQueue.getJob(jobId);
        if (!job) {
            return apiResponder(request, response, next, 404, false, 2000, {
                message: 'Job not found'
            });
        }

        const state = await job.getState();
        const progress = job.progress();
        const result = job.returnvalue;

        return apiResponder(request, response, next, 200, true, 2000, {
            jobId,
            state,
            progress,
            result
        });
    } catch (error) {
        next(error);
    }
};