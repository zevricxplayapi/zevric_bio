// Zevric - JWT to Bio - Direct
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { jwt, bio, token, region = 'IND', new_bio } = { ...req.query, ...req.body };
  const bioText = new_bio || bio;
  const jwtToken = jwt || token;

  if (!jwtToken || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing jwt or bio' });
  }

  const regions = [region, 'IND','BD','PK','BR','SG','ID','TH','VN','ME','US','EU'];
  let lastErr = null;

  for (const r of regions) {
    try {
      const url = `https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwtToken)}&bio=${encodeURIComponent(bioText)}&region=${r}`;
      const resp = await fetch(url);
      const txt = await resp.text();
      let data;
      try { data = JSON.parse(txt); } catch { 
        if (txt.toLowerCase().includes('success') || txt.includes('"result":1')) {
          return res.status(200).json({ status: 'success', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
        }
        throw new Error(txt.slice(0,400));
      }
      if (data.status==='success' || data.result===1 || data.success || data.message?.toLowerCase().includes('success')) {
        return res.status(200).json({ status: 'success', region: r, account_nickname: data.nickname || 'Zevric', account_id: data.uid || '—', bio_update: { nickname: data.nickname || 'Zevric', uid: data.uid || '—', region: r } });
      }
      lastErr = new Error(data.message || data.error || 'Failed');
    } catch(e) {
      lastErr = e;
    }
  }

  return res.status(400).json({ status: 'error', message: lastErr?.message || 'JWT update failed', hint: 'Get fresh JWT from https://zevricplayx.github.io/eat_token/' });
}
