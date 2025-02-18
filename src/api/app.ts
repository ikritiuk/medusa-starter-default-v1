// src/api/app.ts или аналогичный файл
import express from 'express';
import paymentRouter from './routes/payment';

const app = express();
app.use(express.json());
app.use('/payment', paymentRouter);

export default app;
