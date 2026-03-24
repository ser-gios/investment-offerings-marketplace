const db = require('./db');

console.log('Fixing projects with payment_status = paid but status != active...\n');

// Find projects that have been paid but not activated
const projectsToFix = db.prepare("SELECT id, name, status, payment_status FROM projects WHERE payment_status = 'paid' AND status != 'active'").all();

console.log(`Found ${projectsToFix.length} projects to fix:`);
projectsToFix.forEach(p => {
  console.log(`  - ${p.name} (status: ${p.status}, payment: ${p.payment_status})`);
});

if (projectsToFix.length > 0) {
  // Update them to active
  db.prepare("UPDATE projects SET status = 'active' WHERE payment_status = 'paid' AND status != 'active'").run();
  console.log('\n✓ Updated all paid projects to status = active');
  
  // Verify
  const updated = db.prepare("SELECT id, name, status, payment_status FROM projects WHERE payment_status = 'paid'").all();
  console.log(`\nVerification - All paid projects now:`);
  updated.forEach(p => {
    console.log(`  - ${p.name} (status: ${p.status}, payment: ${p.payment_status})`);
  });
}

console.log('\nDone!');
