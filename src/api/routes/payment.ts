// Path: backend/src/api/routes/payment.ts

import { Router } from 'express';
import { OrderService } from '@medusajs/medusa';
import RobokassaProviderService from '../../services/robokassa/robokassa-provider';

const router = Router();

router.post('/create-payment', async (req, res) => {
    const { orderId } = req.body;
    const orderService: OrderService = req.scope.resolve('orderService');
    const robokassaService: RobokassaProviderService = req.scope.resolve('robokassaService');

    try {
        const order = await orderService.retrieve(orderId);
        const paymentUrl = await robokassaService.createPayment({ order });
        res.json({ paymentUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
