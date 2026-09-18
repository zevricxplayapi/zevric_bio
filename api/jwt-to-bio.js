// PROVEN WORKING - Based on DarkForceFREEFIRE FreeFire_Info_Web
// Uses only wzjwt + wzlongsign - the only 2 APIs that are 100% working after OB50
// https://github.com/DarkForceFREEFIRE/FreeFire_Info_Web

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...(req.query || {}), ...(req.body || {}) };
  const tokenRaw = params.access_token || params.eat_token || params.jwt_token || params.jwt || params.token || params.eat || '';
  const bioRaw = params.bio || params.new_bio || '';
  let region = (params.region || 'IND').toString().toUpperCase();

  if (!tokenRaw || !bioRaw) {
    return res.status(400).json({ status: 'error', message: 'access_token and bio required', got: { token: !!tokenRaw, bio: !!bioRaw } });
  }

  const token = tokenRaw.trim();
  let bio = bioRaw.trim();

  // Clean bio - remove control chars that cause "Body is disturbed"
  bio = bio.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Check length - OB50 limit is ~400 chars with codes
  if (bio.length > 500) {
    return res.status(400).json({ 
      status: 'error', 
      message: `Bio too long: ${bio.length} chars. OB50 limit 400 chars. Short karo.`,
      code: 'BIO_TOO_LONG'
    });
  }

  // Step 1: Get JWT
  let jwt = token;
  const isJWT = token.startsWith('eyJ') && token.split('.').length === 3;

  if (!isJWT) {
    // Access/EAT to JWT via wzjwt
    try {
      const url = `https://wzjwt.vercel.app/api/process?mode=access_token&data=${encodeURIComponent(token)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const txt = await r.text();
      let data;
      try { data = JSON.parse(txt); } catch { 
        if (txt.trim().startsWith('eyJ')) { jwt = txt.trim(); }
        else throw new Error('JWT conversion failed: ' + txt.slice(0,200));
      }
      if (!jwt.startsWith('eyJ')) {
        if (data && data.jwt) jwt = data.jwt;
        else if (data && data.token) jwt = data.token;
        else if (data && data.result) jwt = data.result;
        else throw new Error('No JWT in response');
      }
    } catch (e) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Token conversion failed: ' + e.message + '. Token expired? Naya token banao https://zevricplayx.github.io/eat_token/',
        code: 'TOKEN_CONVERT_FAILED'
      });
    }
  }

  // Step 2: Decode JWT to get real region
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

  // Step 3: Update bio via wzlongsign - try with detected region, then fallback regions
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
      
      // Success
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

      // Body disturbed - special handling
      if (msg.includes('body is disturbed') || msg.includes('body is locked') || msg.includes('disturbed or locked')) {
        return res.status(400).json({
          status: 'error',
          message: 'Body is disturbed or locked',
          code: 'BODY_DISTURBED',
          explanation: 'Ye token error NAI hai, bio ka error hai. Garena ne bio reject kiya.',
          why: [
            'Bio me banned word hai',
            'Bio 400+ chars hai color codes ke saath',
            'Special chars galat hai - [B][FF0000] sahi format hai',
            'Account ne 5 min me bahut baar bio change kiya - 1 ghante cooldown',
            'Bio me emoji ya invisible chars hai'
          ],
          fix: [
            'Pehle simple bio try karo: "ZEVRIC YT" (bina color)',
            'Agar simple wala chale to colorful bio ko chhota karo 200 chars tak',
            'Game me manual bio change karke dekho - waha bhi same error aayega to ID cooldown pe hai',
            '1 ghanta wait karo fir try karo'
          ],
          your_bio: bio.substring(0,200),
          your_bio_length: bio.length,
          tried_region: tryRegion
        });
      }

      // Token error
      if (msg.includes('token') && (msg.includes('invalid') || msg.includes('expired') || msg.includes('check'))) {
        return res.status(400).json({
          status: 'error',
          message: 'Token invalid/expired. Naya token banao.',
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

  return res.status(400).json({
    status: 'error',
    message: lastError || 'Update failed',
    code: 'UNKNOWN_ERROR',
    hint: 'Simple bio "ZEVRIC YT" se try karo pehle. Agar wo bhi fail to ID cooldown pe hai.'
  });
}
