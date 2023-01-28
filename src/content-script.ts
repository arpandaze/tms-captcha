import {solve_captcha} from "./evaluate";
import {ResultTypes, SolveResult} from "./interface";

const RELOAD_LIMIT = 3;

let reload_counter = 0;

async function reload_captcha() {
  document?.querySelector('[aria-label="Reload captcha"]')
      ?.dispatchEvent(new Event("click"));
}

function handle_result(result: SolveResult) {
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
  };

  if (reload_counter > RELOAD_LIMIT) {
    console.log(`Failed to solve and reloaded too many times!`);
    return;
  }

  reload_counter++;
  reload_captcha();
}

const target =
    document?.querySelector('.form-control.captcha-image-dimension.col-10');

window.onload = async () => {
  let captcha_blob_url = target?.getAttribute("src");

  if (!captcha_blob_url?.includes("captcha-image.jpg") &&
      captcha_blob_url != null && captcha_blob_url != undefined) {

    let result = await solve_captcha(captcha_blob_url);

    handle_result(result);
  } else {
    console.log("Captcha hasn't loaded!");
  }
};

const config = {
  attributes : true,
  childList : false,
  subtree : false
};

const observer = new MutationObserver(async (mutation_list, _) => {
  let mutated = mutation_list.filter((item) => item.attributeName === "src")[0];

  let target_element = mutated.target as HTMLElement;
  let captcha_blob_url = target_element.getAttribute("src");

  if (!captcha_blob_url) {
    return;
  }

  let result = await solve_captcha(captcha_blob_url);

  handle_result(result);
});

observer.observe(target!, config);
