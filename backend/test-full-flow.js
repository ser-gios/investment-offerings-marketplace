const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('=== TEST: Flujo completo de usuario nuevo ===\n');
  
  // 1. Registrar usuario nuevo
  console.log('1. Registrando usuario nuevo...');
  const testEmail = 'test' + Date.now() + '@example.com';
  const regRes = await request('POST', '/auth/register', {
    email: testEmail,
    password: 'password123',
    name: 'Test User',
    role: 'business'
  });
  console.log(`   Email: ${testEmail}`);
  console.log(`   Respuesta: ${regRes.status} - ${regRes.data.user ? 'OK' : regRes.data.error}`);
  
  if (!regRes.data.token) {
    console.log('   ERROR: No token retornado');
    process.exit(1);
  }
  const token = regRes.data.token;
  console.log(`   Token guardado\n`);
  
  // 2. Crear proyecto
  console.log('2. Creando proyecto...');
  const projRes = await request('POST', '/projects', {
    name: 'Test Project',
    description: 'A test project',
    payout_frequency: 'monthly',
    interest_rate: 10,
    min_investment: 1000,
    max_investment: 100000,
    total_pool: 50000,
    category: 'Technology',
    risk_level: 'medium',
    duration_months: 12
  }, token);
  console.log(`   Respuesta: ${projRes.status} - ${projRes.data.id ? 'OK' : projRes.data.error}`);
  
  if (!projRes.data.id) {
    console.log('   ERROR: No project ID retornado');
    process.exit(1);
  }
  const projId = projRes.data.id;
  console.log(`   Proyecto ID: ${projId}\n`);
  
  // 3. Obtener mis proyectos
  console.log('3. Obteniendo mis proyectos...');
  const myRes = await request('GET', '/projects/my/listings', null, token);
  console.log(`   Respuesta: ${myRes.status}`);
  console.log(`   Proyectos encontrados: ${myRes.data.length}`);
  
  if (myRes.data.length > 0) {
    console.log(`   ✓ Proyecto aparece en /my/listings`);
    console.log(`   Primer proyecto: ${myRes.data[0].name}`);
  } else {
    console.log(`   ✗ NO aparece en /my/listings`);
  }
})();
