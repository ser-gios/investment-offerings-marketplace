const db = require('./db');

const targetEmail = 'sginversion@outlook.com';

console.log('=== CHECKING SPECIFIC USER ===');
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
if (user) {
  console.log(`✓ User found:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role}`);
  
  const projects = db.prepare('SELECT id, name, status, payment_status, created_at FROM projects WHERE user_id = ?').all(user.id);
  console.log(`\n✓ Projects created by this user: ${projects.length}`);
  projects.forEach(p => {
    console.log(`  - ${p.name} (${p.status}, payment: ${p.payment_status})`);
  });
} else {
  console.log(`✗ User NOT found with email: ${targetEmail}`);
}

console.log('\n=== ALL USERS ===');
const users = db.prepare('SELECT id, email, role FROM users').all();
users.forEach(u => console.log(`${u.email} (${u.role})`));
