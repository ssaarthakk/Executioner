import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.use('/execute', executeRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
