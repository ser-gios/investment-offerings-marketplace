const db = require('./db');

console.log('\n📊 ESTADO ACTUAL DE LA BASE DE DATOS\n');

// Usuarios
console.log('👥 USUARIOS:');
const users = db.prepare('SELECT id, email, name, role, balance FROM users').all();
users.forEach(u => {
  console.log(`  - ${u.name} (${u.role}): Balance = $${u.balance}`);
});

// Depósitos
console.log('\n💰 DEPÓSITOS:');
const deposits = db.prepare('SELECT id, investor_id, amount, status, tx_hash, blockchain_verified FROM deposits').all();
if (deposits.length === 0) {
  console.log('  (Sin depósitos)');
} else {
  deposits.forEach(d => {
    const user = users.find(u => u.id === d.investor_id);
    console.log(`  - ${user?.name}: $${d.amount} (${d.status}) - TX: ${d.tx_hash ? 'SÍ' : 'NO'} - Verificado: ${d.blockchain_verified}`);
  });
}

// Inversiones
console.log('\n📈 INVERSIONES:');
const investments = db.prepare('SELECT id, investor_id, project_id, amount, status, paid_from_balance FROM investments').all();
if (investments.length === 0) {
  console.log('  (Sin inversiones)');
} else {
  investments.forEach(inv => {
    const user = users.find(u => u.id === inv.investor_id);
    const proj = db.prepare('SELECT name FROM projects WHERE id = ?').get(inv.project_id);
    console.log(`  - ${user?.name} → "${proj.name}": $${inv.amount} (${inv.status}) - Pagada desde balance: ${inv.paid_from_balance}`);
  });
}

// Proyectos
console.log('\n🏢 PROYECTOS:');
const projects = db.prepare('SELECT id, name, funded_amount, total_pool, payment_status FROM projects').all();
projects.forEach(p => {
  console.log(`  - "${p.name}": $${p.funded_amount} / $${p.total_pool} (Pago: ${p.payment_status})`);
});

console.log('\n');
