// Firefox background script
// This script is required for Firefox manifest v2 compatibility
// It handles browser extension lifecycle events

browser.runtime.onInstalled.addListener(() => {
  console.log('TMSCaptcha extension installed');
});