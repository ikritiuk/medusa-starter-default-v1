import RobokassaProviderService from '../services/robokassa/robokassa-provider';
import YookassaProviderService from '../services/yookassa/yookassa-provider';

export default [
    {
        resolve: RobokassaProviderService,
        options: {
            merchantLogin: 'your-merchant-login',
            password1: 'your-password-1',
            password2: 'your-password-2',
        },
    },
    {
        resolve: YookassaProviderService,
        options: {
            shopId: process.env.YOOKASSA_SHOP_ID,
            secretKey: process.env.YOOKASSA_SECRET_KEY,
            returnUrl: process.env.YOOKASSA_RETURN_URL,
        },
    },
];
