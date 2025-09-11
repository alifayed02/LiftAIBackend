import { Router } from 'express';
import * as subscriptionsController from '../../controllers/subscriptions.controller.js';

const router = Router();

router.get('/id/:id', subscriptionsController.getSubscriptionById);
router.get('/user/:userId', subscriptionsController.listSubscriptionsByUser);
router.get('/', subscriptionsController.listSubscriptions);

router.post('/create', subscriptionsController.createSubscription);
router.patch('/:id', subscriptionsController.updateSubscription);
router.delete('/:id', subscriptionsController.deleteSubscription);

export default router;