// Zevric - Unified Bio Update - Accepts access_token, eat_token, jwt
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...req.query, ...req.body };
  const bio = params.bio || params.new_bio;
  const region = params.region || 'IND';
  const access_token = params.access_token;
  const eat_token = params.eat_token;
  const jwt = params.jwt || params.token;

  if (!bio) return res.status(400).json({ status: 'error', message: 'Missing bio' });

  // Determine token type
  let tokenType = 'unknown';
  let tokenValue = null;
  if (jwt && jwt.startsWith('eyJ')) { tokenType = 'jwt'; tokenValue = jwt; }
  else if (access_token) { tokenType = 'access'; tokenValue = access_token; }
  else if (eat_token) { tokenType = 'eat'; tokenValue = eat_token; }
  else if (params.token) {
    if (params.token.startsWith('eyJ')) { tokenType = 'jwt'; tokenValue = params.token; }
    else { tokenType = 'access'; tokenValue = params.token; }
  }

  if (!tokenValue) return res.status(400).json({ status: 'error', message: 'No token provided. Use access_token, eat_token, or jwt' });

  try {
    if (tokenType === 'jwt') {
      // Direct JWT update via wzlongsign
      const regions = [region, 'IND','BD','PK','SG','BR','ID','TH','VN','ME','US'];
      for (const r of regions) {
        try {
          const url = `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(tokenValue)}&bio=${encodeURIComponent(bio)}&region=${r}`;
          const resp = await fetch(url);
          const txt = await resp.text();
          let data; try { data = JSON.parse(txt); } catch { if (txt.toLowerCase().includes('success')) { data = { status: 'success' }; } else { throw new Error(txt.slice(0,300)); } }
          if (data.status==='success' || data.result===1 || data.success || data.message?.toLowerCase().includes('success')) {
            return res.status(200).json({ status: 'success', region: r, account_nickname: data.nickname || 'Zevric', account_id: data.uid || '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
          }
        } catch {}
      }
      throw new Error('JWT update failed - token expired? Get fresh JWT from https://zevricplayx.github.io/eat_token/');
    } else if (tokenType === 'access') {
      // Use ffapi.cloud bio_change
      const regions = [region, 'IND','BD','PK','SG','BR','ID','TH','VN','ME'];
      for (const r of regions) {
        try {
          const url = `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bio)}&access_token=${encodeURIComponent(tokenValue)}&region=${r}`;
          const resp = await fetch(url);
          const txt = await resp.text();
          let data; try { data = JSON.parse(txt); } catch { if (txt.toLowerCase().includes('success')) return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } }); else throw new Error(txt.slice(0,300)); }
          if (data.success === true || data.success === 'true' || data.message?.toLowerCase().includes('successfully')) {
            return res.status(200).json({ status: 'success', region: r, account_nickname: data.nickname || 'Zevric', account_id: data.account_id || '—', bio_update: { nickname: data.nickname || 'Zevric', uid: data.account_id || '—', region: r } });
          }
          if (data.error && data.error.toLowerCase().includes('invalid')) continue;
        } catch {}
      }
      // Fallback: try login to get JWT then update
      try {
        const loginRes = await fetch(`https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(tokenValue)}`);
        const loginData = await loginRes.json();
        if (loginData.jwt) {
          const jwtToken = loginData.jwt;
          for (const r of regions) {
            try {
              const url = `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bio)}&region=${r}`;
              const resp = await fetch(url);
              const txt = await resp.text();
              let data; try { data = JSON.parse(txt); } catch { if (txt.toLowerCase().includes('success')) return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } }); else throw new Error(txt.slice(0,300)); }
              if (data.status==='success' || data.result===1 || data.success) {
                return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
              }
            } catch {}
          }
        }
      } catch {}
      throw new Error('Access Token update failed - token expired or invalid. Get fresh Access Token from https://zevricplayx.github.io/eat_token/');
    } else if (tokenType === 'eat') {
      // EAT -> Access Token -> Bio
      try {
        const accessRes = await fetch(`https://api-info.ffapi.cloud/api/access-token-gen?eat_token=${encodeURIComponent(tokenValue)}`);
        const accessData = await accessRes.json();
        if (!accessData.access_token) throw new Error('EAT conversion failed - invalid EAT');
        const accessToken = accessData.access_token;
        const regions = [region, 'IND','BD','PK','SG'];
        for (const r of regions) {
          try {
            const url = `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bio)}&access_token=${encodeURIComponent(accessToken)}&region=${r}`;
            const resp = await fetch(url);
            const txt = await resp.text();
            let data; try { data = JSON.parse(txt); } catch { if (txt.toLowerCase().includes('success')) return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } }); else throw new Error(txt.slice(0,300)); }
            if (data.success === true || data.success === 'true' || data.message?.toLowerCase().includes('successfully')) {
              return res.status(200).json({ status: 'success', region: r, account_nickname: data.nickname || 'Zevric', account_id: data.account_id || '—', bio_update: { nickname: data.nickname || 'Zevric', uid: data.account_id || '—', region: r } });
            }
          } catch {}
        }
        throw new Error('EAT to bio failed');
      } catch(e) {
        throw new Error(`EAT error: ${e.message}. Get fresh EAT from https://zevricplayx.github.io/eat_token/`);
      }
    }
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message, hint: 'Get fresh token from https://zevricplayx.github.io/eat_token/ - tokens expire every 2-3 hours' });
  }
}
