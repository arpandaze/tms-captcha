import { Image } from "image-js";

import data from "./data.js";
import { evaluate_captcha } from "./evaluate.js";

let factors = [1, 3, 2, 8, 3];

let reload_limit = 15;

let old_urls = [];

let reload_counter = 0;

window.onload = async () => {
  await async_sleep(100);
  await solve_captcha();
};

async function async_sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

document
  .querySelector('[aria-label="Reload captcha"]')
  .addEventListener("click", async () => {
    reload_counter++;
    if (reload_counter < reload_limit) {
      while (
        old_urls.includes(
          document.getElementsByClassName("captcha-image-dimension")[0]
            .currentSrc
        )
      ) {
        await async_sleep(100);
      }
      await solve_captcha();
    }
  });

async function solve_captcha() {
  let captcha_value = null;
  let captcha_blob_url = null;

  while (!captcha_blob_url) {
    captcha_blob_url = document.getElementsByClassName(
      "captcha-image-dimension"
    )[0].currentSrc;
    await async_sleep(100);
  }
  old_urls.push(captcha_blob_url);

  let captcha_img = await Image.load(captcha_blob_url);
  captcha_value = await evaluate_captcha(captcha_img);

  if (captcha_value.length == 6) {
    let captcha = "";
    captcha_value.map((item) => {
      let sim = Object.entries(data).map((item2) => {
        let absSum = 0;
        item.map((indvItem, index) => {
          absSum += factors[index] * Math.abs(item2[1][index] - indvItem);
        });
        return [item2[0], absSum];
      });
      let sorted_values = sim.sort((a, b) => a[1] - b[1]);
      if (
        sorted_values[0][1] > 60 ||
        sorted_values[1][1] - sorted_values[0][1] < 5
      ) {
        document
          .querySelector('[aria-label="Reload captcha"]')
          .dispatchEvent(new Event("click"));
        return false;
      }
      captcha += sorted_values[0][0];
    });
    document.getElementById("captchaEnter").value = captcha;
    document.getElementById("captchaEnter").dispatchEvent(new Event("input"));
    return true;
  } else {
    document
      .querySelector('[aria-label="Reload captcha"]')
      .dispatchEvent(new Event("click"));
    return false;
  }
}
