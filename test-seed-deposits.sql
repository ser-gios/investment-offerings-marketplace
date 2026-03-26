-- Insert test deposits
INSERT INTO deposits (id, investor_id, amount, status, tx_hash, created_at)
SELECT 
  gen_random_uuid()::text as id,
  u.id as investor_id,
  (ARRAY[500, 1000, 2500, 5000])[floor(random()*4+1)::int] as amount,
  (ARRAY['pending', 'confirmed'])[floor(random()*2+1)::int] as status,
  '0x' || substr(md5(random()::text), 1, 16) as tx_hash,
  NOW() - (ARRAY[1, 2, 3, 7, 14] || ' days'::interval)[floor(random()*5+1)::int]::interval as created_at
FROM users u
WHERE u.role = 'investor'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM deposits ORDER BY created_at DESC LIMIT 10;
