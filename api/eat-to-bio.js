// FINAL FIX - No JWT in response - Dual converter fallback
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...(req.query || {}), ...(req.body || {}) };
  let tokenRaw = (params.access_token || params.eat_token || params.jwt_token || params.jwt || params.token || params.eat || '').toString();
  const bioRaw = (params.bio || params.new_bio || '').toString();
  let region = (params.region || 'IND').toString().toUpperCase();

  if (!tokenRaw || !bioRaw) {
    return res.status(400).json({ status: 'error', message: 'access_token and bio required' });
  }

  // Clean token - remove Bearer, spaces, newlines
  tokenRaw = tokenRaw.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  let token = tokenRaw;
  let bio = bioRaw.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (bio.length > 500) {
    return res.status(400).json({ status: 'error', message: `Bio too long: ${bio.length} chars. Max 400.`, code: 'BIO_TOO_LONG' });
  }

  // Better JWT detection
  const isJWT = token.startsWith('eyJ') && token.split('.').length === 3 && token.length > 100;
  let jwt = token;

  if (!isJWT) {
    // Try 2 converters
    const converters = [
      `https://wzjwt.vercel.app/api/process?mode=access_token&data=${encodeURIComponent(token)}`,
      `https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(token)}`
    ];
    
    let converted = null;
    let lastConvertError = null;
    
    for (const url of converters) {
      try {
        const r = await fetch(url, { 
          headers: { 'User-Agent': 'Zevric-Bio/1.0' },
          signal: AbortSignal.timeout(10000) 
        });
        const txt = await r.text();
        if (!txt) { lastConvertError = 'Empty response from ' + url; continue; }
        
        // Direct JWT string
        if (txt.trim().startsWith('eyJ')) { converted = txt.trim(); break; }
        
        try {
          const data = JSON.parse(txt);
          if (data.jwt && data.jwt.toString().startsWith('eyJ')) { converted = data.jwt; break; }
          if (data.token && data.token.toString().startsWith('eyJ')) { converted = data.token; break; }
          if (data.result && data.result.toString().startsWith('eyJ')) { converted = data.result; break; }
          if (data.data && data.data.toString().startsWith('eyJ')) { converted = data.data; break; }
          if (data.jwt_token && data.jwt_token.toString().startsWith('eyJ')) { converted = data.jwt_token; break; }
          lastConvertError = data.message || data.error || txt.slice(0,200);
        } catch {
          lastConvertError = txt.slice(0,300);
        }
      } catch (e) {
        lastConvertError = e.message;
        continue;
      }
    }

    if (!converted) {
      return res.status(400).json({
        status: 'error',
        message: `Token conversion failed: ${lastConvertError || 'No JWT in response'}. Token invalid? Naya token banao https://zevricplayx.github.io/eat_token/`,
        code: 'JWT_CONVERT_FAILED',
        hint: 'Access/EAT token expire ho sakta hai. Naya token banao aur fir try karo. Agar JWT de rahe ho to pura JWT paste karo eyJ se start.',
        token_type: token.length < 50 ? 'Access (32 chars)' : token.length < 150 ? 'EAT?' : 'Unknown',
        token_length: token.length
      });
    }
    jwt = converted;
  }

  // Decode JWT for region
  try {
    const parts = jwt.split('.');
    if (parts.length === 3) {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
      const payload = JSON.parse(Buffer.from(b64 + pad, 'base64').toString());
      const realRegion = payload.lock_region || payload.region || payload.server;
      if (realRegion) region = realRegion.toString().toUpperCase();
    }
  } catch {}

  // Update bio
  const regionsToTry = [region, 'IND', 'BR', 'SG', 'US', 'ID', 'TH', 'ME', 'PK', 'BD'].filter((v,i,a)=>a.indexOf(v)===i);
  let lastError = null;

  for (const tryRegion of regionsToTry) {
    try {
      const url = `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bio)}&region=${encodeURIComponent(tryRegion)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const txt = await r.text();
      let data;
      try { data = JSON.parse(txt); } catch { data = { message: txt }; }
      const msg = (data.message || data.error || '').toString().toLowerCase();

      if (data.status === 'success' || msg.includes('success') || data.success === true) {
        return res.status(200).json({
          status: 'success',
          message: 'Bio Updated Successfully!',
          region: tryRegion,
          account_nickname: data.account_nickname || data.nickname || 'Player',
          account_id: data.account_id || data.uid || '',
          new_bio: bio,
          bio_update: { nickname: data.account_nickname || 'Player', uid: data.account_id || '', region: tryRegion }
        });
      }

      if (msg.includes('body is disturbed') || msg.includes('body is locked')) {
        return res.status(400).json({
          status: 'error',
          message: 'Body is disturbed or locked',
          code: 'BODY_DISTURBED',
          fix: 'Simple bio ZEVRIC se try karo. Agar wo chale to colorful bio chhota karo 200 chars tak.',
          your_bio: bio.substring(0,200),
          your_bio_length: bio.length
        });
      }

      if (msg.includes('token') && (msg.includes('invalid') || msg.includes('expired') || msg.includes('check'))) {
        return res.status(400).json({
          status: 'error',
          message: 'Token invalid/expired. Naya token banao https://zevricplayx.github.io/eat_token/',
          code: 'TOKEN_INVALID',
          original: data.message || data.error
        });
      }

      lastError = data.message || data.error || txt;
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  return res.status(400).json({ status: 'error', message: lastError || 'Update failed', code: 'UNKNOWN' });
}
