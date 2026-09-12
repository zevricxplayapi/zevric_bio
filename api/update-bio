// Zevric - Access Token to Bio - 101% working
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { access_token, bio, region = 'IND', new_bio } = req.query.method ? req.query : { ...req.query, ...req.body };
  const bioText = new_bio || bio;
  const token = access_token;

  if (!token || !bioText) {
    return res.status(400).json({ status: 'error', message: 'Missing access_token or bio' });
  }

  // Try multiple APIs in order for Access Token
  const endpoints = [
    // Primary: ffapi.cloud bio_change - directly with access_token
    {
      url: `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(token)}&region=${region}`,
      type: 'ffapi_cloud'
    },
    // Backup 1: Try different regions
    {
      url: `https://api-info.ffapi.cloud/api/bio_change?new_bio=${encodeURIComponent(bioText)}&access_token=${encodeURIComponent(token)}&region=BD`,
      type: 'ffapi_cloud_bd'
    },
    // Backup 2: Try login to get JWT then update via wzlongsign
    {
      url: null,
      type: 'jwt_fallback'
    }
  ];

  let lastError = null;

  for (const ep of endpoints) {
    try {
      if (ep.type === 'jwt_fallback') {
        // Try to get JWT from access_token via ffapi.cloud login
        try {
          const loginRes = await fetch(`https://api-info.ffapi.cloud/api/login?access_token=${encodeURIComponent(token)}`);
          const loginData = await loginRes.json();
          if (loginData.jwt) {
            // Now update bio via wzlongsign using JWT
            const jwt = loginData.jwt;
            const bioRes = await fetch(`https://wzlongsign.vercel.app/updatebio?token=${encodeURIComponent(jwt)}&bio=${encodeURIComponent(bioText)}&region=${region}`);
            const bioData = await bioRes.json();
            if (bioData.status === 'success' || bioData.result === 1 || bioData.success || (bioData.message && bioData.message.toLowerCase().includes('success'))) {
              return res.status(200).json({
                status: 'success',
                message: 'Bio updated via JWT fallback',
                region: region,
                account_nickname: bioData.nickname || 'Zevric',
                account_id: bioData.uid || '—',
                bio_update: { nickname: 'Zevric', uid: '—', region: region }
              });
            }
          }
        } catch(e) {
          lastError = e;
          continue;
        }
        continue;
      }

      const response = await fetch(ep.url, {
        method: 'GET',
        headers: { 'User-Agent': 'Zevric-Bio-Updater/1.0' }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // If not JSON but contains success
        if (text.toLowerCase().includes('success') || text.includes('"success": "true"') || text.includes('"success":true')) {
          return res.status(200).json({
            status: 'success',
            message: 'Bio Updated Successfully!',
            region: region,
            account_nickname: 'Zevric',
            account_id: '—',
            bio_update: { nickname: 'Zevric', uid: '—', region: region }
          });
        }
        throw new Error(text.slice(0,500));
      }

      // Check ffapi.cloud response format
      if (data.success === true || data.success === 'true' || data.status === 'success' || (data.message && data.message.toLowerCase().includes('successfully'))) {
        return res.status(200).json({
          status: 'success',
          message: data.message || 'Bio Updated Successfully!',
          region: region,
          account_nickname: data.nickname || 'Zevric',
          account_id: data.account_id || data.uid || '—',
          old_bio: data.old_bio,
          new_bio: data.new_bio || bioText,
          bio_update: { nickname: data.nickname || 'Zevric', uid: data.account_id || '—', region: region }
        });
      }

      // If error is token invalid, try next region or fallback
      if (data.error && (data.error.toLowerCase().includes('invalid') || data.error.toLowerCase().includes('failed to authenticate'))) {
        lastError = new Error(data.error);
        continue;
      }

      // Other error
      if (data.error || data.message) {
        lastError = new Error(data.error || data.message);
        // If it's not token error, maybe still try fallback
        if (!data.error.toLowerCase().includes('region')) {
          continue;
        }
      }

    } catch (err) {
      lastError = err;
      console.error(`Endpoint ${ep.type} failed:`, err.message);
      continue;
    }
  }

  // All failed
  return res.status(400).json({
    status: 'error',
    message: lastError ? lastError.message : 'Failed to update bio. Token may be expired or invalid. Get fresh token from https://zevricplayx.github.io/eat_token/',
    error: 'Failed to retrieve JWT or update bio',
    hint: 'Get fresh Access Token from https://zevricplayx.github.io/eat_token/ - Tokens expire every 2-3 hours'
  });
}
