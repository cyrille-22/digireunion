const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./src/config/database');
const { port } = require('./src/config/env');

const authRoutes = require('./src/routes/auth');
const memberRoutes = require('./src/routes/members');
const tontineRoutes = require('./src/routes/tontines');
const pretRoutes = require('./src/routes/prets');
const seanceRoutes = require('./src/routes/seances');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/tontines', tontineRoutes);
app.use('/api/v1/pret-rubriques', pretRoutes);
app.use('/api/v1/seances', seanceRoutes);

app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Digi-Reunion API v1.0 fonctionne',
      database: 'PostgreSQL connecte',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.listen(port, () => {
  console.log('Serveur demarre sur http://localhost:' + port);
});