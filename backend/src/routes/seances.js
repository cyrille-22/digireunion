const express = require('express');
const router = express.Router();
const {
  ouvrirSeance, pointerPresence,
  saisirTransaction, getCaisse, cloturerSeance
} = require('../controllers/seanceController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

router.use(authMiddleware);

// Ouvrir une séance
router.post('/', requireRole('president', 'secretaire'), ouvrirSeance);

// Pointage présences
router.post('/:id/pointage', requireRole('president', 'secretaire'), pointerPresence);

// Saisir une transaction
router.post('/:id/transactions', requireRole('president', 'secretaire'), saisirTransaction);

// Caisse en temps réel
router.get('/:id/caisse', getCaisse);

// Clôturer la séance
router.post('/:id/cloture', requireRole('president', 'secretaire', 'tresorier'), cloturerSeance);

module.exports = router;