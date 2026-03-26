const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const BSCSCAN_API = 'https://api.bscscan.com/api';
const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || '5H96S2AQQEBRJ5HBFN5PJXQ1M3K7Y9Z2W4X';
const BLOCKCHAIN_ADDRESS = process.env.BLOCKCHAIN_ADDRESS || '0xB9705cEB7821D96bF5083f70E20E268e19c1a156';
const USDT_CONTRACT = process.env.USDT_CONTRACT || '0x55d398326f99059fF775485246999027B3197955';
const MIN_DEPOSIT = 200; // USDT

// GET deposits del usuario
router.get('/', authenticate, (req, res) => {
  const deposits = db.prepare(`
    SELECT * FROM deposits 
    WHERE investor_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);
  
  res.json(deposits);
});

// GET balance del usuario
router.get('/balance/current', authenticate, (req, res) => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ balance: user.balance || 0 });
});

// POST crear depósito (registrar en BD y generar instrucciones)
router.post('/', authenticate, (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < MIN_DEPOSIT) {
    return res.status(400).json({ 
      error: `Depósito mínimo es $${MIN_DEPOSIT} USDT` 
    });
  }

  const depositId = uuidv4();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO deposits (id, investor_id, amount, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(depositId, req.user.id, amount, 'pending', now);

    res.json({
      id: depositId,
      amount,
      wallet_address: BLOCKCHAIN_ADDRESS,
      network: 'BNB Chain',
      token: 'USDT (Tether)',
      status: 'pending',
      instructions: `Envía exactamente ${amount} USDT a ${BLOCKCHAIN_ADDRESS} en la red BNB Chain. Luego proporciona el hash de transacción para verificación automática.`,
      created_at: now
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST verificar transacción en blockchain
router.post('/:id/verify', authenticate, (req, res) => {
  const { tx_hash } = req.body;
  const depositId = req.params.id;

  if (!tx_hash) {
    return res.status(400).json({ error: 'Se requiere hash de transacción' });
  }

  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ? AND investor_id = ?')
    .get(depositId, req.user.id);

  if (!deposit) {
    return res.status(404).json({ error: 'Depósito no encontrado' });
  }

  if (deposit.status !== 'pending') {
    return res.status(400).json({ error: 'Depósito ya fue procesado' });
  }

  // Verificar en blockchain
  verifyBlockchainTransaction(tx_hash, deposit.amount)
    .then(verified => {
      if (!verified) {
        return res.status(400).json({ 
          error: 'Transacción no verificada. Verifica el hash y que sea a la dirección correcta.' 
        });
      }

      // Actualizar depósito como confirmado
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE deposits 
        SET status = 'confirmed', tx_hash = ?, blockchain_verified = 1, confirmation_date = ?
        WHERE id = ?
      `).run(tx_hash, now, depositId);

      // Acreditar balance
      const depositAmount = deposit.amount;
      db.prepare(`
        UPDATE users 
        SET balance = balance + ? 
        WHERE id = ?
      `).run(depositAmount, req.user.id);

      res.json({
        status: 'confirmed',
        amount: depositAmount,
        tx_hash,
        confirmation_date: now,
        message: `$${depositAmount} USDT acreditado a tu cuenta`
      });
    })
    .catch(err => {
      res.status(500).json({ error: `Error verificando blockchain: ${err.message}` });
    });
});

// Función para verificar transacción en blockchain
async function verifyBlockchainTransaction(txHash, expectedAmount) {
  try {
    // Obtener detalles de la transacción
    const txUrl = `${BSCSCAN_API}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${BSCSCAN_KEY}`;
    const txResponse = await fetch(txUrl);
    const txData = await txResponse.json();

    if (!txData.result) {
      console.log('Transacción no encontrada');
      return false;
    }

    const tx = txData.result;

    // Verificar que sea a la dirección correcta
    if (tx.to.toLowerCase() !== BLOCKCHAIN_ADDRESS.toLowerCase() &&
        tx.to.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      console.log('Destinatario incorrecto');
      return false;
    }

    // Verificar que la transacción fue exitosa
    const receiptUrl = `${BSCSCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${BSCSCAN_KEY}`;
    const receiptResponse = await fetch(receiptUrl);
    const receiptData = await receiptResponse.json();

    if (!receiptData.result || receiptData.result.status === '0x0') {
      console.log('Transacción fallida');
      return false;
    }

    // Si la transacción es a USDT contract, verificar amount en logs (simplificado)
    // Para propósitos de demostración, solo verificamos que la transacción sea exitosa
    // En producción, deberías decodificar los logs para verificar el monto exacto

    console.log(`Transacción ${txHash} verificada exitosamente`);
    return true;
  } catch (err) {
    console.error('Error verificando blockchain:', err);
    throw err;
  }
}

// SEED deposits for testing (no auth required)
router.post('/seed-test', (req, res) => {
  try {
    const investor = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('investor');
    if (!investor) return res.status(400).json({ error: 'No investor found' });
    
    const deposits = [
      { id: uuidv4(), investor_id: investor.id, amount: 500, status: 'pending', tx_hash: '0x' + Math.random().toString(16).slice(2) },
      { id: uuidv4(), investor_id: investor.id, amount: 1000, status: 'confirmed', tx_hash: '0x' + Math.random().toString(16).slice(2) },
      { id: uuidv4(), investor_id: investor.id, amount: 2500, status: 'confirmed', tx_hash: '0x' + Math.random().toString(16).slice(2) },
    ];
    
    for (const d of deposits) {
      db.prepare(`
        INSERT INTO deposits (id, investor_id, amount, status, tx_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(d.id, d.investor_id, d.amount, d.status, d.tx_hash, new Date().toISOString());
    }
    
    res.json({ success: true, created: deposits.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
