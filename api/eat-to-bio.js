// Zevric - EAT to Bio - OB55 FIXED 300 letters
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = { ...req.query, ...req.body };
  const bioText = params.bio || params.new_bio;
  const eat = params.eat_token || params.eat;
  const region = params.region || 'IND';

  if (!eat || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing eat_token or bio' });
  }

  const visible = bioText.replace(/\[[A-F0-9]{6}\]/gi,'').replace(/\[[BIUSCLR]\]/gi,'').replace(/\\n/g,'\n');
  if (visible.length > 300) {
    return res.status(400).json({ status: 'error', message: `Bio too long: ${visible.length} > 300` });
  }

  try {
    // Step 1: EAT -> Access Token
    const accessRes = await fetch(`https://api-info.ffapi.cloud/api/access-token-gen?eat_token=${encodeURIComponent(eat)}`);
    const accessText = await accessRes.text();
    let accessData;
    try { accessData = JSON.parse(accessText); } catch {
      return res.status(400).json({ status: 'error', message: 'Failed to convert EAT - Invalid EAT', raw: accessText.slice(0,300) });
    }
    if (!accessData.access_token) {
      return res.status(400).json({ status: 'error', message: 'EAT conversion failed', error: accessData.error });
    }

    const accessToken = accessData.access_token;

    // Step 2: Try bio change with multiple regions
    const regions = [region, 'IND','BD','SG','BR'];
    for (let r of regions) {
      try {
        const bioRes = await fetch(`https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(accessToken)}&region=${r}`);
        const bioTextRes = await bioRes.text();
        if (bioTextRes.toLowerCase().includes('success')) {
          return res.status(200).json({ status: 'success', message: 'Bio Updated via EAT - 300 working', region: r, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region: r } });
        }
        let bioData; try { bioData = JSON.parse(bioTextRes); } catch { continue; }
        if (bioData.success === true || bioData.success === 'true' || bioData.message?.toLowerCase().includes('successfully')) {
          return res.status(200).json({ status: 'success', message: bioData.message, region: r, account_nickname: bioData.nickname || 'Zevric', account_id: bioData.account_id || '—', bio_update: { nickname: bioData.nickname || 'Zevric', uid: bioData.account_id || '—', region: r } });
        }
      } catch {}
    }

    // Fallback to JWT
    try {
      const loginRes = await fetch(`https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(accessToken)}`);
      const loginData = await loginRes.json();
      if (loginData.jwt) {
        const jwt = loginData.jwt;
        const jwtRes = await fetch(`https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bioText)}&region=${region}`);
        const jwtText = await jwtRes.text();
        if (jwtText.toLowerCase().includes('success')) {
          return res.status(200).json({ status: 'success', message: 'Bio Updated via EAT->JWT - 300 working', region, account_nickname: 'Zevric', account_id: '—', bio_update: { nickname: 'Zevric', uid: '—', region } });
        }
      }
    } catch {}

    return res.status(400).json({ status: 'error', message: 'Failed to update bio via EAT after trying all regions' });

  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message, hint: 'Get fresh EAT from https://zevricplayx.github.io/eat_token/' });
  }
}
