// Zevric - Access Token to Bio - OB55 FIXED 300 letters working
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...req.query, ...req.body };
  const bioText = params.bio || params.new_bio;
  const token = params.access_token || params.token;
  const region = params.region || 'IND';

  if (!token || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing access_token or bio' });
  }

  // FIX: Allow 300 visible chars - strip color codes for count
  const visible = bioText.replace(/\[[A-F0-9]{6}\]/gi,'').replace(/\[[BIUSCLR]\]/gi,'').replace(/\\n/g,'\n');
  if (visible.length > 300) {
    return res.status(400).json({ status: 'error', message: `Bio too long: ${visible.length} > 300 (visible)` });
  }

  // OB55 FIX: Try new endpoints + old as fallback
  const endpoints = [
    // NEW PRIMARY for OB55: direct client endpoint with personal_show
    { url: `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(token)}&region=${region}`, type: 'ffapi_ind' },
    { url: `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(token)}&region=BD`, type: 'ffapi_bd' },
    { url: `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(token)}&region=SG`, type: 'ffapi_sg' },
    // FALLBACK: try login to JWT then update (bypass 50 limit)
    { url: null, type: 'jwt_fallback' }
  ];

  let lastError = null;

  for (const ep of endpoints) {
    try {
      if (ep.type === 'jwt_fallback') {
        try {
          const loginRes = await fetch(`https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(token)}`);
          const loginText = await loginRes.text();
          let loginData; try { loginData = JSON.parse(loginText); } catch { continue; }
          if (loginData.jwt) {
            const jwt = loginData.jwt;
            // Try wzlongsign + new backup endpoints
            const jwtEndpoints = [
              `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bioText)}&region=${region}`,
              `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bioText)}&region=IND`,
              `https://free-fire-bio-update.vercel.app/api/update-bio?jwt=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bioText)}&region=${region}`
            ];
            for (let ju of jwtEndpoints) {
              try {
                const r = await fetch(ju);
                const t = await r.text();
                if (t.toLowerCase().includes('success') || t.includes('"result":1') || t.includes('"status":"success"')) {
                  return res.status(200).json({ status: 'success', message: 'Bio Updated via JWT fallback - 300 working', region, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region } });
                }
              } catch {}
            }
          }
        } catch(e) { lastError = e; continue; }
        continue;
      }

      const response = await fetch(ep.url, { method: 'GET', headers: { 'User-Agent': 'Zevric-Bio-Updater/1.0' } });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch {
        if (text.toLowerCase().includes('success')) {
          return res.status(200).json({ status: 'success', message: 'Bio Updated Successfully! 300 letters working', region, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region } });
        }
        throw new Error(text.slice(0,500));
      }

      if (data.success === true || data.success === 'true' || data.status === 'success' || data.message?.toLowerCase().includes('successfully')) {
        return res.status(200).json({ status: 'success', message: data.message || 'Bio Updated Successfully! OB55 Fixed', region, account_nickname: data.nickname || 'Zevric', account_id: data.account_id || '—', bio_update: { nickname: data.nickname || 'Zevric', uid: data.account_id || '—', region } });
      }
      if (data.error) { lastError = new Error(data.error); continue; }

    } catch (err) {
      lastError = err;
      continue;
    }
  }

  return res.status(400).json({ status: 'error', message: lastError ? lastError.message : 'Failed to update bio. Token expired? Get fresh token from https://zevricplayx.github.io/eat_token/', hint: 'For 300 letters use JWT token - Access token now limited to 50 after OB55' });
}
