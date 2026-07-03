import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import preferencesRoutes from './routes/preferences.js';
import allotmentsRoutes from './routes/allotments.js';
import enrollmentsRoutes from './routes/enrollments.js';
import requestsRoutes from './routes/requests.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Course Allotment API' });
});

app.use('/auth', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/preferences', preferencesRoutes);
app.use('/allotments', allotmentsRoutes);
app.use('/allotment', allotmentsRoutes); // frontend calls /allotment/result
app.use('/enrollments', enrollmentsRoutes);
app.use('/requests', requestsRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
