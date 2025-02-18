import axios from 'axios';
import crypto from 'crypto';

interface RobokassaOptions {
    merchantLogin: string;
    password1: string;
    password2: string;
}

interface PaymentSessionResponse {
    session_id: string;
    redirect_url: string;
    status: string;
}

enum PaymentSessionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
}

class RobokassaProviderService {
    static identifier = 'robokassa';

    private readonly options: RobokassaOptions;

    constructor(options: RobokassaOptions) {
        this.options = options;
    }

    private createSignature(
        params: Record<string, string | number>,
        password: string
    ): string {
        const values = Object.values(params).join(':');
        return crypto.createHash('md5').update(`${values}:${password}`).digest('hex');
    }

    async createPayment(
        context: any
    ): Promise<PaymentSessionResponse> {
        const { order } = context;
        const { id, total } = order;
        const params = {
            MerchantLogin: this.options.merchantLogin,
            OutSum: (total / 100).toFixed(2),
            InvId: id,
            Description: `Order ${id}`,
            SuccessURL: 'https://your-success-url.com',
            FailURL: 'https://your-fail-url.com',
            SignatureValue: '', // Initialize SignatureValue here
        };

        const signature = this.createSignature(
            params,
            this.options.password1
        );
        params.SignatureValue = signature;

        const queryString = new URLSearchParams(
            params as any
        ).toString();
        const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${queryString}`;

        return {
            session_id: id,
            redirect_url: paymentUrl,
            status: PaymentSessionStatus.PENDING,
        };
    }

    async retrievePayment(
        data: any
    ): Promise<PaymentSessionStatus> {
        // Implement retrieval and verification of payment status from Robokassa here
        return PaymentSessionStatus.PENDING;
    }

    async updatePayment(
        data: any
    ): Promise<PaymentSessionStatus> {
        // Implement updating payment status or details if necessary
        return PaymentSessionStatus.PENDING;
    }

    async authorizePayment(
        context: any
    ): Promise<PaymentSessionStatus> {
        // Implement payment authorization logic here
        // For example, check payment status from a webhook or callback
        // and return the appropriate PaymentSessionStatus
        const { order } = context;
        const { id } = order;

        // Mock implementation: assume payment is authorized immediately
        return PaymentSessionStatus.SUCCESS; // Change this based on actual implementation logic
    }
}

export default RobokassaProviderService;
