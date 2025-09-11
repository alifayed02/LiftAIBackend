import { Router } from 'express';
import * as plansController from '../../controllers/plans.controller.js';

const router = Router();

router.get('/id/:id', plansController.getPlanById);
router.get('/', plansController.listPlans);

export default router;


