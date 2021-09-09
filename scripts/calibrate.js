import fs from "fs";
import { Image } from "image-js";

import { evaluate_captcha } from "../src/evaluate.js";

let files = fs.readdirSync("./scripts/images/");

let data = {};

let promises = files.map(async (filename) => {
  let img = await Image.load(`./scripts/images/${filename}`);
  let res = await evaluate_captcha(img);
  if (res.length == 6) {
    res.map((item, index) => {
      if (!data[filename[index]]) {
        data[filename[index]] = [];
      }
      data[filename[index]].push(item);
    });
  }
  return res;
});

Promise.all(promises).then(() => {
  Object.entries(data).map((item) => {
    let holder = [];
    item[1].map((ent) => {
      ent.map((fet, index) => {
        holder[index] = holder[index] || 0 + fet;
      });
    });
    data[item[0]] = holder;
  });
  console.log(data)
});
