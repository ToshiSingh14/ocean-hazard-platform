const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLiveVisibleDemo() {
  console.log('=== LAUNCHING LIVE HEADED BROWSER DEMO ON USER DESKTOP ===');

  // Launch in headed/visible mode on the active interactive desktop session
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  async function slowType(selector, text, delayMs = 35) {
    await page.waitForSelector(selector, { visible: true });
    await page.$eval(selector, el => el.value = '');
    await page.type(selector, text, { delay: delayMs });
  }

  async function submitReportLive(description, options = {}) {
    // If we are currently showing a submission result, click "Submit Another Report"
    const resetBtn = await page.$('button ::-p-text(Submit Another Report)');
    if (resetBtn) {
      await resetBtn.click();
      await sleep(1200);
    }

    // Type description visibly
    await slowType('textarea', description, 25);
    await sleep(600);

    // If custom location text is specified
    if (options.locationText !== undefined) {
      await page.$eval('input[type="text"]', (el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, options.locationText);
      await sleep(600);
    }

    // Click submit button
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    }

    // Wait for the AI NLP classification card to render
    await page.waitForSelector('.bg-emerald-950\\/40, .bg-slate-900', { visible: true, timeout: 12000 });
    // Pause so the user can see the AI NLP card, detected hazard, severity and confidence
    await sleep(3500);
  }

  try {
    // 1. Open Landing Dashboard
    console.log('[Step 1] Opening Landing Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await sleep(3000);

    // 2. Navigate to Report Submission
    console.log('[Step 2] Navigating to Report Submission page...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle0' });
    await sleep(2000);

    // 3. Category 1: Abnormal Waves
    console.log('[Step 3] Submitting Abnormal Waves report...');
    await submitReportLive(
      'Huge waves are crashing against the shoreline and damaging fishing boats near Puri beach.',
      { locationText: 'Puri Beach Shore' }
    );

    // 4. Category 2: Storm Surge
    console.log('[Step 4] Submitting Storm Surge report...');
    await submitReportLive(
      'A powerful storm surge is pushing seawater into the coastal settlement with rising water level.',
      { locationText: 'Paradip Coastal Area' }
    );

    // 5. Category 3: Coastal Flooding
    console.log('[Step 5] Submitting Coastal Flooding report...');
    await submitReportLive(
      'Seawater has entered houses and submerged the nearby coastal road and market area.',
      { locationText: 'Gopalpur Shoreline' }
    );

    // 6. Category 4: Coastal Erosion
    console.log('[Step 6] Submitting Coastal Erosion report...');
    await submitReportLive(
      'The shoreline is retreating and the beach is losing land due to continuous wave action and collapsing seawall.',
      { locationText: 'Chandipur Coast' }
    );

    // 7. Category 5: Marine Incident
    console.log('[Step 7] Submitting Marine Incident report...');
    await submitReportLive(
      'A fishing vessel has suffered an accident and capsized near the coast with crew stranded.',
      { locationText: 'Chennai Port Offshore' }
    );

    // 8. Category 6: Other
    console.log('[Step 8] Submitting Other (benign / non-hazard) report...');
    await submitReportLive(
      'The coastal market is organizing a cultural event this weekend with music and food stalls.',
      { locationText: 'Puri Beach Market' }
    );

    // 9. Location Extraction: Puri and Paradip
    console.log('[Step 9] Demonstrating Location Extraction (Paradip)...');
    await submitReportLive(
      'Massive abnormal waves breaking violently near Paradip port area.',
      { locationText: 'Paradip Port' }
    );

    // 10. GPS Priority: Text mentions Puri, user overrides GPS to Mumbai
    console.log('[Step 10] Demonstrating GPS Priority (Text mentions Puri, GPS set to Mumbai)...');
    await submitReportLive(
      'Severe seawater entering coastal houses near Puri coast.',
      { locationText: 'Mumbai Coast GPS Pin (19.0760, 72.8777)' }
    );

    // 11. Incident Clustering: Two nearby reports in Puri
    console.log('[Step 11] Demonstrating Incident Clustering with 2 nearby reports...');
    await submitReportLive(
      'Large waves are damaging fishing boats near Puri beach.',
      { locationText: 'Puri Beach Shore' }
    );
    await submitReportLive(
      'Huge waves are creating dangerous conditions for fishermen near Puri beach.',
      { locationText: 'Puri Beach Shore' }
    );

    // 12. Open Reports Page
    console.log('[Step 12] Opening Citizen Reports Log table...');
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
    await sleep(4000);

    // 13. Open Incident Map
    console.log('[Step 13] Opening Live GIS Incident Map...');
    await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle0' });
    await sleep(5000);

    // 14. Unclear / Conversational Input
    console.log('[Step 14] Testing Unclear Input ("Hello, how are you?")...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle0' });
    await sleep(1500);
    await submitReportLive('Hello, how are you? Just visiting the beach.');

    console.log('\n=== LIVE DEMONSTRATION COMPLETE ===');
    console.log('Leaving visible browser window open on your screen.');

    // Keep the browser open indefinitely so the user can interact with it
    await new Promise(() => {});

  } catch (err) {
    console.error('Error during live demonstration:', err);
  }
}

runLiveVisibleDemo();
