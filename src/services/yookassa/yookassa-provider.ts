import {
    AbstractPaymentProcessor,
    PaymentProcessorContext,
    PaymentProcessorError,
    PaymentProcessorSessionResponse,
    PaymentSessionStatus,
} from "@medusajs/medusa";
import axios from "axios";
import {randomUUID} from "crypto";

// Define the options for the YooKassa provider
interface YookassaOptions {
    shopId: string;
    secretKey: string;
    returnUrl: string;
}

class YookassaProviderService extends AbstractPaymentProcessor {
    static identifier = "yookassa";

    private readonly options: YookassaOptions;
    private readonly client: any;

    constructor(_, options: YookassaOptions) {
        super(_, options);
        this.options = options;
        this.client = axios.create({
            baseURL: "https://api.yookassa.ru/v3",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${Buffer.from(`${this.options.shopId}:${this.options.secretKey}`).toString("base64")}`,
            },
        });
    }

    async createPayment(
        context: PaymentProcessorContext
    ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
        const {amount, currency_code, metadata} = context;
        const idempotenceKey = randomUUID();

        const createPaymentPayload = {
            amount: {
                value: (amount / 100).toFixed(2),
                currency: currency_code.toUpperCase(),
            },
            confirmation: {
                type: 'redirect',
                return_url: `${this.options.returnUrl}/${metadata.order_id}`,
            },
            capture: true,
            description: `Order ${metadata.order_id}`,
        };

        try {
            const response = await this.client.post("/payments", createPaymentPayload, {
                headers: {
                    "Idempotence-Key": idempotenceKey,
                }
            });
            const payment = response.data;
            return {
                session_data: {
                    id: payment.id,
                    url: payment.confirmation.confirmation_url,
                },
                update_requests: {
                    metadata: {
                        ...metadata,
                        payment_id: payment.id,
                    },
                },
            };
        } catch (error) {
            return {
                error: "Failed to create payment",
            };
        }
    }

    async retrievePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        try {
            const response = await this.client.get(`/payments/${paymentSessionData.id}`);
            return response.data;
        } catch (error) {
            return {
                error: "Failed to retrieve payment",
            };
        }
    }

    async updatePayment(
        context: PaymentProcessorContext
    ): Promise<PaymentProcessorError | void> {
        // YooKassa payments are updated via webhooks, so this method is not needed
        return;
    }

    async deletePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        // YooKassa API does not support deleting payments, but it supports cancellation
        return this.cancelPayment(paymentSessionData);
    }

    async authorizePayment(
        paymentSessionData: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<| PaymentProcessorError
        | {
        status: PaymentSessionStatus;
        data: Record<string, unknown>;
    }> {
        try {
            const response = await this.client.get(`/payments/${paymentSessionData.id}`);
            const payment = response.data;
            switch (payment.status) {
                case "succeeded":
                    return {
                        status: PaymentSessionStatus.AUTHORIZED,
                        data: payment,
                    };
                case "pending":
                    return {
                        status: PaymentSessionStatus.PENDING,
                        data: payment,
                    };
                case "canceled":
                    return {
                        status: PaymentSessionStatus.CANCELED,
                        data: payment,
                    };
                default:
                    return {
                        status: PaymentSessionStatus.ERROR,
                        data: payment,
                    };
            }
        } catch (error) {
            return {
                error: "Failed to authorize payment",
            };
        }
    }

    async capturePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        try {
            const idempotenceKey = randomUUID();
            const response = await this.client.post(`/payments/${paymentSessionData.id}/capture`, {}, {
                headers: {
                    "Idempotence-Key": idempotenceKey,
                }
            });
            return response.data;
        } catch (error) {
            return {
                error: "Failed to capture payment",
            };
        }
    }

    async refundPayment(
        paymentSessionData: Record<string, unknown>,
        refundAmount: number
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        const { currency_code } = paymentSessionData;
        try {
            const idempotenceKey = randomUUID();
            const response = await this.client.post("/refunds", {
                payment_id: paymentSessionData.id,
                amount: {
                    value: (refundAmount / 100).toFixed(2),
                    currency: currency_code as string,
                },
            }, {
                headers: {
                    "Idempotence-Key": idempotenceKey,
                }
            });
            return response.data;
        } catch (error) {
            return {
                error: "Failed to refund payment",
            };
        }
    }

    async cancelPayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<Record<string, unknown> | PaymentProcessorError> {
        try {
            const idempotenceKey = randomUUID();
            const response = await this.client.post(`/payments/${paymentSessionData.id}/cancel`, {}, {
                headers: {
                    "Idempotence-Key": idempotenceKey,
                }
            });
            return response.data;
        } catch (error) {
            return {
                error: "Failed to cancel payment",
            };
        }
    }
}

export default YookassaProviderService;
