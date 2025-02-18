import RobokassaProviderService from '../services/robokassa/robokassa-provider';

export default [
    {
        resolve: RobokassaProviderService,
        options: {
            merchantLogin: 'your-merchant-login',
            password1: 'your-password-1',
            password2: 'your-password-2',
        },
    },
];
