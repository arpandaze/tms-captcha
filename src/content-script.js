import { Image } from "image-js";

import data from "./data.js";
import { evaluate_captcha } from "./evaluate.js";

let factors = [1, 3, 2, 8, 3];

window.onload = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  let solved = await solve_captcha();
  while(!solved){
    await solve_captcha();
  }
};

document.querySelector('[aria-label="Reload captcha"]').addEventListener("click", async ()=>{
  setTimeout(async ()=>await solve_captcha(), 100)
})

async function solve_captcha(){
  let captcha_blob_url = document.getElementsByClassName(
    "captcha-image-dimension"
  )[0].currentSrc;
  while (!captcha_blob_url) {
    captcha_blob_url = document.getElementsByClassName(
      "captcha-image-dimension"
    )[0].currentSrc;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  let captcha_img = await Image.load(captcha_blob_url);
  let captcha_value = await evaluate_captcha(captcha_img);

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
      captcha += sorted_values[0][0];
    });
    document.getElementById("captchaEnter").value = captcha;
    document.getElementById("captchaEnter").dispatchEvent(new Event("input", { bubbles: true}));
    return true;
  }
}
