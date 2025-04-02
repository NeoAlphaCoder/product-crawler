import express from 'express';
import { productCrawler, checkJobStatus } from '../controllers/crawlers/product.js';

const router = express.Router();

router.post('/product', productCrawler);
router.get('/job-status', checkJobStatus);

export default router;