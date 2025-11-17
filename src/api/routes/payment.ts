// Path: backend/src/api/routes/payment.ts

import { Router } from 'express';
import { OrderService } from '@medusajs/medusa';
import YookassaProviderService from '../../services/yookassa/yookassa-provider';
import RobokassaProviderService from '../../services/robokassa/robokassa-provider';

const router = Router();

router.post('/create-payment', async (req, res) => {
    const { orderId, providerId } = req.body;
    const orderService: OrderService = req.scope.resolve('orderService');

    try {
        const order = await orderService.retrieve(orderId);
        let paymentResponse;
        const context = {
            amount: order.total,
            currency_code: order.currency_code,
            metadata: {
                order_id: order.id,
            },
        };

        if (providerId === 'yookassa') {
            const yookassaService: YookassaProviderService = req.scope.resolve('yookassaService');
            paymentResponse = await yookassaService.createPayment(context);
        } else if (providerId === 'robokassa') {
            const robokassaService: RobokassaProviderService = req.scope.resolve('robokassaService');
            paymentResponse = await robokassaService.createPayment(context);
        } else {
            return res.status(400).json({ error: 'Invalid payment provider' });
        }

        if (paymentResponse.error) {
            return res.status(500).json({ error: paymentResponse.error });
        }

        res.json({ paymentUrl: paymentResponse.session_data.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
