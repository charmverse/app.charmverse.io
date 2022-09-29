// silence compiler error
export {};

// Run the test server with npm run start:test, then execute 'dotenv -e .env.test.local -- ts-node __e2e__/record-custom.spec.ts'
// Once the page loads, click 'Record' to start recording your interaction with the app

// (async () => {
//   // ARRANGE
//   // Make sure to run headed.
//   const browser = await chromium.launch({ headless: false });

//   // Setup context however you like.
//   const context = await browser.newContext({ /* pass any options */ });
//   await context.route('**/*', route => route.continue());

//   // Pause the page, and start recording manually.
//   const page = await context.newPage();

//   const domain = `domain-${v4()}`;

//   const { space, user } = await createUserAndSpace({
//     browserPage: page
//   });

//   page.goto(baseUrl as string);

//   await page.pause();
// })();
