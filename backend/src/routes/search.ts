import { Router } from 'express';
import { searchController } from '../controllers/SearchController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);
router.get('/', searchController.search);

export default router;
