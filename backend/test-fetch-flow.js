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
  console.log('=== TEST: Registrando con sginversion@outlook.com ===\n');
  
  // Registrar con el email del usuario
  const regRes = await request('POST', '/auth/register', {
    email: 'sginversion@outlook.com',
    password: 'password123',
    name: 'SG Inversion',
    role: 'business'
  });
  
  console.log('Status:', regRes.status);
  console.log('Response:', JSON.stringify(regRes.data, null, 2));
  
  if (regRes.status === 200 && regRes.data.token) {
    console.log('\n✓ Registro exitoso');
    const token = regRes.data.token;
    
    // Crear proyecto
    console.log('\nCreando proyecto...');
    const projRes = await request('POST', '/projects', {
      name: 'Mi Primer Proyecto',
      description: 'Descripción del proyecto',
      payout_frequency: 'monthly',
      interest_rate: 10,
      min_investment: 1000,
      max_investment: 100000,
      total_pool: 50000,
      category: 'Technology',
      risk_level: 'medium',
      duration_months: 12
    }, token);
    
    console.log('Project Status:', projRes.status);
    if (projRes.status === 201) {
      console.log('✓ Proyecto creado:', projRes.data.id);
      
      // Obtener mis proyectos
      console.log('\nObteniendo mis proyectos...');
      const myRes = await request('GET', '/projects/my/listings', null, token);
      console.log('Projects found:', myRes.data.length);
      if (myRes.data.length > 0) {
        console.log('✓ Proyecto aparece en /my/listings');
      }
    }
  } else {
    console.log('\n✗ Error en el registro:', regRes.data.error);
  }
})();
