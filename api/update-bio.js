// Zevric - Unified Bio Update - OB55 FIXED 300 letters working 101%
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
  const jwt = params.jwt || params.token || params.jwt_token;

  if (!bio) return res.status(400).json({ status: 'error', message: 'Missing bio' });

  // FIX: Allow 300 visible
  const visible = bio.replace(/\[[A-F0-9]{6}\]/gi,'').replace(/\[[BIUSCLR]\]/gi,'').replace(/\\n/g,'\n');
  if (visible.length > 300) {
    return res.status(400).json({ status: 'error', message: `Bio too long: ${visible.length} > 300` });
  }

  let tokenType = 'unknown';
  let tokenValue = null;
  if (jwt && jwt.startsWith('eyJ')) { tokenType = 'jwt'; tokenValue = jwt; }
  else if (access_token) { tokenType = 'access'; tokenValue = access_token; }
  else if (eat_token) { tokenType = 'eat'; tokenValue = eat_token; }
  else if (params.token) {
    if (params.token.startsWith('eyJ')) { tokenType = 'jwt'; tokenValue = params.token; }
    else { tokenType = 'access'; tokenValue = params.token; }
  }

  if (!tokenValue) return res.status(400).json({ status: 'error', message: 'No token provided' });

  try {
    // OB55 FIX: For 300 letters, JWT is primary
    if (tokenType === 'jwt' || visible.length > 50) {
      // Try JWT first for 300
      const regions = [region, 'IND','BD','PK','SG','BR','ID','TH','VN','ME','US'];
      for (const r of regions) {
        try {
          // Try multiple JWT backends
          const urls = [
            `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(tokenValue)}&bio=${encodeURIComponent(bio)}&region=${r}`,
            `https://ff-long-bio-update-tools.vercel.app/api/bio?jwt_token=${encodeURIComponent(tokenValue)}&bio=${encodeURIComponent(bio)}&key=m41nul-x&region=${r}`
          ];
          for (let url of urls) {
            const resp = await fetch(url);
            const txt = await resp.text();
            if (txt.toLowerCase().includes('success') || txt.includes('"result":1')) {
              return res.status(200).json({ status: 'success', message: 'Bio Updated 300 - OB55 Fixed', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
            }
          }
        } catch {}
      }
      if (tokenType === 'jwt') throw new Error('JWT update failed - Get fresh JWT');
      // If access token but >50, try convert to JWT
    }

    if (tokenType === 'access') {
      const regions = [region, 'IND','BD','PK','SG','BR','ID','TH','VN','ME'];
      for (const r of regions) {
        try {
          const url = `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bio)}&access_token=${encodeURIComponent(tokenValue)}&region=${r}`;
          const resp = await fetch(url);
          const txt = await resp.text();
          if (txt.toLowerCase().includes('success')) {
            return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
          }
        } catch {}
      }
      // Fallback: login to get JWT
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
              if (txt.toLowerCase().includes('success')) {
                return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
              }
            } catch {}
          }
        }
      } catch {}
      throw new Error('Access Token update failed - For 300 letters use JWT token. Access token limited to 50 after OB55.');
    } else if (tokenType === 'eat') {
      try {
        const accessRes = await fetch(`https://api-info.ffapi.cloud/api/access-token-gen?eat_token=${encodeURIComponent(tokenValue)}`);
        const accessData = await accessRes.json();
        if (!accessData.access_token) throw new Error('EAT conversion failed');
        const accessToken = accessData.access_token;
        for (const r of [region, 'IND','BD','SG']) {
          try {
            const url = `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bio)}&access_token=${encodeURIComponent(accessToken)}&region=${r}`;
            const resp = await fetch(url);
            const txt = await resp.text();
            if (txt.toLowerCase().includes('success')) {
              return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
            }
          } catch {}
        }
        throw new Error('EAT to bio failed');
      } catch(e) {
        throw new Error(`EAT error: ${e.message}`);
      }
    }
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message, hint: 'For 300 letters use JWT - Get fresh token from https://zevricplayx.github.io/eat_token/' });
  }
}
