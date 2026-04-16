import fetch from 'node-fetch';
import fs from 'fs';

const API_KEY = 'AQ.Ab8RN6KbK863CEc2LaykpAFIIso8owVOazowEiGJ5_cSKKHtoQ';
const PROJECT_ID = '17725074750313660420';

const MOBILE_SCREENS = [
  { id: 'a2dc7f5b59944cd8bc944222c9be5966', name: 'SplashLanguageSelection' },
  { id: '13179b5c6efb4b8dbc8e199a977c1d81', name: 'LocationBoatSetup' },
  { id: '234e1a64f617438dbe453a5075df212c', name: 'MainDashboard' },
  { id: 'd48f7dd3038448f68b223443b6dbfede', name: 'NauticalSafetyMap' },
  { id: 'ac1c4ed018bd4e3d91b004a0b7d71030', name: 'AlertsCommunityFeed' },
  { id: 'dc0c15e5585e47c3a3299089d2354cad', name: 'SettingsNotifications' }
];

async function fetchScreenCode(screenId, screenName) {
  const response = await fetch(
    `https://stitch.googleapis.com/v1/projects/${PROJECT_ID}/screens/${screenId}?key=${API_KEY}`,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const data = await response.json();
  
  // Get the HTML download URL
  if (data.htmlCode && data.htmlCode.downloadUrl) {
    const htmlResponse = await fetch(data.htmlCode.downloadUrl);
    const htmlContent = await htmlResponse.text();
    
    fs.writeFileSync(`./screens/${screenName}.html`, htmlContent);
    console.log(`Saved ${screenName}.html`);
  }
  
  // Save the screen metadata too
  fs.writeFileSync(`./screens/${screenName}_meta.json`, JSON.stringify(data, null, 2));
  console.log(`Saved ${screenName}_meta.json`);
  
  return data;
}

async function main() {
  if (!fs.existsSync('./screens')) {
    fs.mkdirSync('./screens');
  }
  
  for (const screen of MOBILE_SCREENS) {
    try {
      await fetchScreenCode(screen.id, screen.name);
    } catch (err) {
      console.error(`Error fetching ${screen.name}:`, err.message);
    }
  }
}

main();