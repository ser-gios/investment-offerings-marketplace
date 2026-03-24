const http = require('http');

// Login first
const loginReq = http.request('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const { token } = JSON.parse(data);
    console.log('Token:', token);

    // Now get /my/listings with token
    const opts = 'http://localhost:3001/api/projects/my/listings';
    const req2 = http.request(opts, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('My Projects:', JSON.parse(data2));
      });
    });
    req2.on('error', e => console.error('Error:', e));
    req2.end();
  });
});

loginReq.write(JSON.stringify({
  email: 'greentech@demo.com',
  password: 'demo123'
}));
loginReq.on('error', e => console.error('Error:', e));
loginReq.end();
