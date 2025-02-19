import {solve_captcha} from "./evaluate";
import {ResultTypes, SolveResult} from "./interface";

const RELOAD_LIMIT = 3;
const INITIAL_RETRY_LIMIT = 5;
const RETRY_DELAY = 500; // ms

let reload_counter = 0;
let initial_retry_counter = 0;

async function reload_captcha() {
  const reloadButton = document?.querySelector('[aria-label="Reload captcha"]');
  if (reloadButton) {
    reloadButton.dispatchEvent(new Event("click"));
  }
}

async function waitForImageLoad(img: HTMLImageElement): Promise<boolean> {
  return new Promise((resolve) => {
    if (img.complete) {
      resolve(true);
      return;
    }

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

async function handle_result(result: SolveResult) {
  switch (result.type) {
    case ResultTypes.Success: {
      console.log(`Solved: ${result.value}`);
      return;
    }

    case ResultTypes.LowConfidence: {
      console.log(`Failed to solve due to low confidence. Reloading!`);
      break;
    }

    case ResultTypes.InvalidLength: {
      console.log(`Value: ${result.value}`);
      console.log(`Failed to solve. Got captcha length < 6. Reloading!`);
      break;
    }
  }

  if (reload_counter > RELOAD_LIMIT) {
    console.log(`Failed to solve and reloaded too many times!`);
    return;
  }

  reload_counter++;
  await reload_captcha();
}

async function processCaptcha(captchaImg: HTMLImageElement) {
  const captcha_blob_url = captchaImg.getAttribute("src");
  
  if (!captcha_blob_url) {
    console.log("No captcha URL found");
    return;
  }

  if (captcha_blob_url.includes("captcha-image.jpg")) {
    console.log("Placeholder captcha detected, waiting for real one");
    return;
  }

  // Wait for the image to be fully loaded
  const imageLoaded = await waitForImageLoad(captchaImg);
  if (!imageLoaded) {
    console.log("Image failed to load");
    return;
  }

  const result = await solve_captcha(captcha_blob_url);
  await handle_result(result);
}

async function initializeCaptchaSolver() {
  const captchaImg = document.querySelector('.form-control.captcha-image-dimension.col-10') as HTMLImageElement;
  
  if (!captchaImg) {
    if (initial_retry_counter < INITIAL_RETRY_LIMIT) {
      console.log(`Captcha element not found, retrying... (${initial_retry_counter + 1}/${INITIAL_RETRY_LIMIT})`);
      initial_retry_counter++;
      setTimeout(initializeCaptchaSolver, RETRY_DELAY);
    } else {
      console.log("Failed to find captcha element after all retries");
    }
    return;
  }

  // Process initial captcha
  await processCaptcha(captchaImg);

  // Set up observer for future changes
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        await processCaptcha(mutation.target as HTMLImageElement);
      }
    }
  });

  observer.observe(captchaImg, {
    attributes: true,
    attributeFilter: ['src']
  });
}

// Start the initialization process when the content script loads
initializeCaptchaSolver();

// Also try again when the window loads (as a backup)
window.addEventListener('load', () => {
  if (initial_retry_counter < INITIAL_RETRY_LIMIT) {
    initializeCaptchaSolver();
  }
});
