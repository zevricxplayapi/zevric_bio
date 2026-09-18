// Zevric - EAT to Bio - 101% working
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { eat_token, bio, region = 'IND', new_bio } = { ...req.query, ...req.body };
  const bioText = new_bio || bio;
  const eat = eat_token;

  if (!eat || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing eat_token or bio' });
  }

  try {
    // Step 1: Convert EAT to Access Token via ffapi.cloud
    const accessRes = await fetch(`https://api-info.ffapi.cloud/api/access-token-gen?eat_token=${encodeURIComponent(eat)}`);
    const accessText = await accessRes.text();
    let accessData;
    try {
      accessData = JSON.parse(accessText);
    } catch {
      return res.status(400).json({ status: 'error', message: 'Failed to convert EAT token - Invalid EAT', raw: accessText.slice(0,300) });
    }

    if (!accessData.access_token) {
      return res.status(400).json({ status: 'error', message: 'EAT conversion failed - Invalid EAT token', error: accessData.error });
    }

    const accessToken = accessData.access_token;

    // Step 2: Use Access Token to update bio via bio_change endpoint
    const bioRes = await fetch(`https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(accessToken)}&region=${region}`);
    const bioTextRes = await bioRes.text();
    let bioData;
    try {
      bioData = JSON.parse(bioTextRes);
    } catch {
      if (bioTextRes.toLowerCase().includes('success')) {
        return res.status(200).json({
          status: 'success',
          message: 'Bio Updated via EAT',
          region: region,
          account_nickname: 'Zevric',
          account_id: '—',
          bio_update: { nickname: 'Zevric', uid: '—', region: region }
        });
      }
      throw new Error(bioTextRes.slice(0,500));
    }

    if (bioData.success === true || bioData.success === 'true' || bioData.message?.toLowerCase().includes('successfully')) {
      return res.status(200).json({
        status: 'success',
        message: bioData.message,
        region: region,
        account_nickname: bioData.nickname || 'Zevric',
        account_id: bioData.account_id || '—',
        bio_update: { nickname: bioData.nickname || 'Zevric', uid: bioData.account_id || '—', region: region }
      });
    }

    return res.status(400).json({ status: 'error', message: bioData.error || bioData.message || 'Failed to update bio via EAT', data: bioData });

  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message, hint: 'Get fresh EAT from https://zevricplayx.github.io/eat_token/' });
  }
}
