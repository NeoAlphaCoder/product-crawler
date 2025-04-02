# E-commerce Product URL Crawler

A scalable crawler system that extracts product URLs from e-commerce websites using a queue-based architecture.

## Features

- Scalable queue-based crawling system
- Support for JavaScript-rendered content
- Site-specific URL pattern matching
- Structured output in JSON format
- Progress tracking and job status monitoring
- Automatic retry mechanism for failed jobs

## Technical Approach

### 1. Product URL Detection

The crawler uses multiple strategies to identify product URLs:

1. **URL Pattern Matching**:
   - Generic patterns: `/products/`, `/items/`, `/p-`, `/shop/`, etc.
   - Site-specific patterns for each e-commerce platform
   - Example: `www.example.com/product/12345`

2. **HTML Structure Analysis**:
   - Checks for product-specific attributes (`data-product-id`, `data-item-id`, `data-sku`)
   - Looks for price elements and product-specific classes
   - Validates against multiple criteria to ensure URL points to a product page

3. **Validation Criteria**:
   - URL structure matches product patterns
   - Presence of product-specific HTML attributes
   - Existence of price elements
   - Product-specific CSS classes

### 2. Architecture

1. **Queue System**:
   - Uses Bull queue with Redis for job management
   - Handles concurrent crawling of multiple domains
   - Automatic retry with exponential backoff
   - Job status monitoring

2. **Content Fetching**:
   - Primary: Puppeteer for JavaScript-rendered content
   - Fallback: Axios for static content
   - User-agent rotation to avoid blocking

3. **Output Structure**:
   - Individual JSON files per domain
   - Summary file with crawling statistics
   - Database storage for persistence

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
REDIS_HOST=localhost
REDIS_PORT=6379
```

3. Start Redis server

4. Run the application:
```bash
npm start
```

## API Endpoints

1. **Start Crawling**:
```http
POST /crawler/product
Content-Type: application/json

{
    "urls": [
        "https://www.virgio.com/",
        "https://www.tatacliq.com/",
        "https://nykaafashion.com/",
        "https://www.westside.com/"
    ]
}
```

2. **Check Job Status**:
```http
GET /crawler/job-status?jobId=your_job_id
```

## Output Structure

1. **Per Domain File** (`output/domain_products.json`):
```json
{
    "domain": "www.example.com",
    "totalProducts": 100,
    "lastUpdated": "2024-03-14T12:00:00Z",
    "productUrls": [
        "https://www.example.com/product/12345",
        "https://www.example.com/product/67890"
    ]
}
```

2. **Summary File** (`output/summary.json`):
```json
{
    "totalDomains": 4,
    "lastUpdated": "2024-03-14T12:00:00Z",
    "domains": [
        {
            "domain": "www.example.com",
            "totalProducts": 100,
            "lastUpdated": "2024-03-14T12:00:00Z"
        }
    ]
}
```

## Error Handling

- Automatic retry for failed jobs
- Error logging with detailed information
- Graceful degradation when services are unavailable
- Rate limiting to avoid overwhelming target sites

## Performance Considerations

- Concurrent processing with controlled concurrency
- Caching of visited URLs to avoid duplicates
- Efficient database operations
- Memory management for large crawls

## Future Improvements

1. Add support for more e-commerce platforms
2. Implement rate limiting per domain
3. Add proxy support for distributed crawling
4. Create a web dashboard for monitoring
5. Add support for custom URL patterns 