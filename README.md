<h1 align="center">
TMS Captcha Solver
</h1>
<p align="center"> Extension for chromium based browsers to solve and autofill captchas on NEPSE TMS sites. </p>
<h2 align="center">
Demo
</h2>
<p align="center"><img src="https://user-images.githubusercontent.com/46302068/215273678-4ba5f4fc-01b5-4ab6-bad9-429388e4d366.gif" width="400"/></p>

# Installation
* Download `TMSCaptcha_v*.zip` from releases page.
* Go to `chrome://extensions/` in your browser and enable developer mode.<br/>
* Drag and drop the zip in extensions page.<br/>

# Building:
* Clone the repository!<br/>
* Install the dependencies with: `yarn install`<br/>
* Build Chrome version: `yarn build:chrome`<br/>
* Build Firefox version: `yarn build:firefox`<br/>
* Build both versions: `yarn build:all`<br/>

# Publishing to Firefox Add-ons:
To publish the extension to Firefox Add-ons:

1. Get your API credentials from [AMO's API Keys page](https://addons.mozilla.org/en-US/developers/addon/api/key/)
2. Set environment variables:
   ```bash
   export MOZILLA_JWT_ISSUER="your-jwt-issuer"
   export MOZILLA_JWT_SECRET="your-jwt-secret"
   ```
3. Run the publish command:
   ```bash
   yarn publish:firefox
   ```

The extension will be built, signed, and submitted to Firefox Add-ons for review.
