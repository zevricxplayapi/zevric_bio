// Zevric - JWT to Bio - OB55 FIXED 300 letters - PRIMARY for 300
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...req.query, ...req.body };
  const bioText = params.bio || params.new_bio;
  const jwtToken = params.jwt || params.token || params.jwt_token;
  const region = params.region || 'IND';

  if (!jwtToken || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing jwt or bio' });
  }

  const visible = bioText.replace(/\[[A-F0-9]{6}\]/gi,'').replace(/\[[BIUSCLR]\]/gi,'').replace(/\\n/g,'\n');
  if (visible.length > 300) {
    return res.status(400).json({ status: 'error', message: `Bio too long: ${visible.length} > 300` });
  }

  const regions = [region, 'IND','BD','PK','BR','SG','ID','TH','VN','ME','US','EU'];
  let lastErr = null;

  // OB55 FIX: Try multiple JWT endpoints
  const jwtEndpoints = (r) => [
    `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bioText)}&region=${r}`,
    `https://wzlongsign.vercel.app/api/update-bio?token=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bioText)}&region=${r}`,
    `https://free-fire-bio-update.vercel.app/api/update-bio?jwt=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bioText)}&region=${r}`,
    `https://ff-long-bio-update-tools.vercel.app/api/bio?jwt_token=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bioText)}&key=m41nul-x&region=${r}`
  ];

  for (const r of regions) {
    for (let url of jwtEndpoints(r)) {
      try {
        const resp = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Zevric-OB55-Fixed' } });
        const txt = await resp.text();
        let data;
        try { data = JSON.parse(txt); } catch {
          if (txt.toLowerCase().includes('success') || txt.includes('"result":1') || txt.includes('updated')) {
            return res.status(200).json({ status: 'success', message: 'Bio Updated 300 letters - OB55 Fixed', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
          }
          throw new Error(txt.slice(0,400));
        }
        if (data.status==='success' || data.result===1 || data.success || data.message?.toLowerCase().includes('success')) {
          return res.status(200).json({ status: 'success', message: 'Bio Updated 300 - JWT', region: r, account_nickname: data.nickname || 'Zevric', account_id: data.uid || '—', bio_update: { nickname: data.nickname || 'Zevric', uid: data.uid || '—', region: r } });
        }
        lastErr = new Error(data.message || data.error || 'Failed');
      } catch(e) {
        lastErr = e;
      }
    }
  }

  return res.status(400).json({ status: 'error', message: lastErr?.message || 'JWT update failed - Token expired?', hint: 'For 300 letters use fresh JWT from https://zevricplayx.github.io/eat_token/ - Get new token every 2 hours' });
}
