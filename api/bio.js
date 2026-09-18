// FINAL FIX - Bio limit 300, actual 298 chars
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

  tokenRaw = tokenRaw.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  let token = tokenRaw;
  let bio = bioRaw.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // NEW LIMIT: 300 declared, 298 actual allowed (2 chars protobuf overhead)
  const MAX_BIO = 298;
  if (bio.length > MAX_BIO) {
    return res.status(400).json({
      status: 'error',
      message: `Bio too long: ${bio.length} chars. Limit 300 hai but 298 allow karta hai. ${bio.length - MAX_BIO} chars kam karo.`,
      code: 'BIO_TOO_LONG',
      limit: 300,
      actual_allowed: 298,
      your_length: bio.length,
      extra: bio.length - MAX_BIO
    });
  }

  const isJWT = token.startsWith('eyJ') && token.split('.').length === 3;
  let jwt = token;

  if (isJWT) {
    try {
      const parts = jwt.split('.');
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
      const payload = JSON.parse(Buffer.from(b64 + pad, 'base64').toString());
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp < now) {
        const expiredAgo = Math.floor((now - exp) / 60);
        return res.status(400).json({
          status: 'error',
          message: `JWT expired ${expiredAgo} min ago. Naya token banao https://zevricplayx.github.io/eat_token/`,
          code: 'JWT_EXPIRED'
        });
      }
      const realRegion = payload.lock_region || payload.region || payload.server;
      if (realRegion) region = realRegion.toString().toUpperCase();
    } catch {}
  }

  if (!isJWT) {
    const converters = [
      `https://wzjwt.vercel.app/api/process?mode=access_token&data=${encodeURIComponent(token)}`,
      `https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(token)}`,
      `https://ff-jwt.vercel.app/api/convert?token=${encodeURIComponent(token)}`
    ];
    let converted = null;
    let lastErr = null;
    for (const url of converters) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Zevric/1.0' }, signal: AbortSignal.timeout(15000) });
        const txt = await r.text();
        if (!txt) { lastErr = 'Empty from ' + url; continue; }
        if (txt.trim().startsWith('eyJ')) { converted = txt.trim(); break; }
        try {
          const d = JSON.parse(txt);
          if (d.jwt?.startsWith('eyJ')) { converted = d.jwt; break; }
          if (d.token?.startsWith('eyJ')) { converted = d.token; break; }
          if (d.result?.startsWith('eyJ')) { converted = d.result; break; }
          if (d.data?.startsWith('eyJ')) { converted = d.data; break; }
          if (d.jwt_token?.startsWith('eyJ')) { converted = d.jwt_token; break; }
          lastErr = d.message || d.error || txt.slice(0,200);
        } catch { lastErr = txt.slice(0,300); }
      } catch (e) { lastErr = e.message; continue; }
    }
    if (!converted) {
      return res.status(400).json({
        status: 'error',
        message: `Token conversion failed: ${lastErr}. Naya token banao https://zevricplayx.github.io/eat_token/`,
        code: 'CONVERT_FAILED'
      });
    }
    jwt = converted;
    try {
      const parts = jwt.split('.');
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
      const payload = JSON.parse(Buffer.from(b64 + pad, 'base64').toString());
      const realRegion = payload.lock_region || payload.region || payload.server;
      if (realRegion) region = realRegion.toString().toUpperCase();
    } catch {}
  }

  const regionsToTry = [region, 'IND', 'BR', 'SG', 'US', 'ID', 'TH', 'ME', 'PK', 'BD'].filter((v,i,a)=>a.indexOf(v)===i);
  let lastError = null;

  for (const tryRegion of regionsToTry.slice(0,5)) {
    try {
      const url = `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bio)}&region=${encodeURIComponent(tryRegion)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const txt = await r.text();
      let data;
      try { data = JSON.parse(txt); } catch { data = { message: txt, raw: txt }; }

      const rawLower = (txt || '').toLowerCase();
      const msg = (data.message || data.error || data.bio_submit || '').toString();
      const msgLower = msg.toLowerCase();

      if (data.status === 'success' || msgLower.includes('success') || data.success === true || rawLower.includes('"success":true')) {
        return res.status(200).json({
          status: 'success',
          message: 'Bio Updated Successfully!',
          region: tryRegion,
          account_nickname: data.account_nickname || data.nickname || data.name || 'Player',
          account_id: data.account_id || data.uid || data.id || '',
          new_bio: bio,
          bio_length: bio.length,
          limit_info: '300 limit, 298 allowed - used ' + bio.length,
          bio_update: { nickname: data.account_nickname || 'Player', uid: data.account_id || '', region: tryRegion }
        });
      }

      if (data.status_code === 401 || msgLower.includes('unauthorized') || rawLower.includes('401') || rawLower.includes('unauthorized') || (data.success === false && txt.includes('clientbp.ggpolarbear.com'))) {
        if (txt.includes('clientbp.ggpolarbear.com') || txt.includes('401')) {
          return res.status(401).json({
            status: 'error',
            message: 'Token invalid/expired (401). Naya token banao https://zevricplayx.github.io/eat_token/',
            code: 'TOKEN_401',
            original_response: txt.slice(0,500)
          });
        }
      }

      if (msgLower.includes('body is disturbed') || msgLower.includes('body is locked')) {
        return res.status(400).json({
          status: 'error',
          message: 'Body is disturbed or locked',
          code: 'BODY_DISTURBED',
          fix: `Bio ${bio.length} chars hai, limit 298 hai. Chhota karo. Simple bio ZEVRIC se try karo.`,
          your_bio: bio,
          your_length: bio.length,
          limit: 298
        });
      }

      lastError = msg || data.message || data.error || txt.slice(0,500);
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  return res.status(400).json({ status: 'error', message: lastError || 'Update failed', code: 'UNKNOWN' });
}
