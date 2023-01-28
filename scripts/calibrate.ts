import fs from "fs";
import {Image} from "image-js";

import {evaluate_captcha} from "../src/evaluate";
import {KindEntry} from "../src/interface";
import {kinds} from "../src/kinds";

Object.values(kinds).map((kind: KindEntry) => {
  let files = fs.readdirSync(kind.data_path);

  let data: Map<string, Array<Array<number>>> = new Map();

  let promises = files.map(async (filename) => {
    let img = await Image.load(`${kind.data_path}/${filename}`);

    let res = await evaluate_captcha(img);

    if (res.length == 6) {
      res.map((item, index) => {
        let char: string = filename[index];

        if (!data.get(char)) {
          data.set(char, []);
        }

        data.get(char)?.push(item);
      });
    }

    return res;
  });

  Promise.all(promises).then(() => {
    let averaged_data: Map<string, Array<number>> = new Map();

    data.forEach((value, key: string) => {
      if (value.length > 1) {
        let sums = value.reduce((acc, new_val) => {
          let temp_summed =
              acc.map((item, index) => { return item + new_val[index]; });

          return temp_summed;
        });

        sums = sums.map((item) => item / value.length);

        averaged_data.set(key, sums);
      } else {
        averaged_data.set(key, value[0]);
      }
    });

    let json_data = (JSON.stringify(Object.fromEntries(averaged_data)));

    fs.writeFileSync(`src/data/${kind.write_name}`, json_data);
  });
})
