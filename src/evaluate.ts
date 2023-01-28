import {Image} from "image-js";

import DATA_BOLD from "./data/bold_data.json"
import DATA_SLIM from "./data/slim_data.json"
import {ResultTypes, SolveResult} from "./interface";

let EMPTY = "assets/empty.jpg";
let DATA_PATH = "data";

if (typeof window === "object") {
  EMPTY = chrome.runtime.getURL(EMPTY);
  DATA_PATH = chrome.runtime.getURL(DATA_PATH);
} else {
  EMPTY = `./src/${EMPTY}`;
  DATA_PATH = `./src/${DATA_PATH}`;
}

const FACTORS = [ 1, 3, 2, 8, 3 ];

enum Kind {
  Bold,
  Slim
}

async function solve_captcha(
    captcha_uri: string,
    kind?: Kind,
    ): Promise<SolveResult> {
  let captcha_value = null;

  let data: {[key: string]: number[]};

  if (kind === Kind.Bold || !kind) {
    data = DATA_BOLD;
  } else {
    data = DATA_SLIM;
  }

  let captcha_img = await Image.load(captcha_uri);
  captcha_value = await evaluate_captcha(captcha_img);

  let captcha = "";

  for (let i = 0; i < captcha_value.length; i++) {
    let item = captcha_value[i];
    let sim: Array<[ string, number ]> =
        Object.entries(data).map((character) => {
          let abs_sum = 0;

          item.map((indv_property, index) => {
            abs_sum +=
                FACTORS[index] * Math.abs(character[1][index] - indv_property);
          });

          return [ character[0], abs_sum ];
        });

    let sorted_values = sim.sort((a, b) => a[1] - b[1]);

    if (sorted_values[0][1] > 60 ||
        sorted_values[1][1] - sorted_values[0][1] < 5) {
      if (kind) {
        return {
          type : ResultTypes.LowConfidence,
          value : captcha,
        };
      } else {
        return solve_captcha(captcha_uri, Kind.Slim)
      }
    }

    captcha += sorted_values[0][0];
  }

  if (captcha_value.length == 6) {
    if (typeof window === "object") {
      let captcha_field =
          document?.getElementById("captchaEnter") as HTMLInputElement;

      captcha_field.value = captcha;

      captcha_field?.dispatchEvent(new Event("input"));
    }

    return {type : ResultTypes.Success, value : captcha};

  } else {

    return {
      type : ResultTypes.InvalidLength,
      value : captcha,
    };
  }
}

/*
Image is first splitted into individual characters by finding empty line between
characters.

Then each character is evalauated based on 5 factors:
  - Average Pixel Value
  - Horizontal Length of Image
  - Average Pixel of Vertical Left Half of Image
  - Average Pixel of Horizontal Top Half of Image
  - Average Pixel of Horizontal Bottom Half of Image
*/
async function evaluate_captcha(img: Image): Promise<Array<Array<number>>> {
  let cleaned = await clean_image(img);

  let counter = 0;
  let matrix = [];
  let matrix_list = [];

  // Splitting images by characters
  for (let i = 0; i < 130; i++) {
    let columnEmpty = true;
    for (let j = 0; j < 35; j++) {
      if (cleaned.data[130 * j + i]) {
        if (!counter) {
          matrix.splice(0, matrix.length - (matrix.length % 35));
        }
        columnEmpty = false;
        matrix.push(1);
        counter++;
      } else if (j == 34 && counter && columnEmpty) {
        matrix.push(0);
        matrix_list.push(matrix.splice(0, matrix.length - 35));

        matrix = [];
        counter = 0;
      } else {
        matrix.push(0);
      }
    }
  }

  let averages: Array<Array<number>> = [];

  matrix_list.map((char_mat: Array<number>) => {
    let temp_img = to_image(char_mat, 35).rotateRight().flipX();
    let average =
        temp_img.getSum().reduce((acc, val) => {return acc + val}) / 256;

    let vAvg = vavg(temp_img);
    let hAvg = htopavg(temp_img);
    let hbtAvg = hbotavg(temp_img);

    averages.push([ average, vAvg, hAvg, hbtAvg, char_mat.length / 35 ]);
  });

  return averages;
}

// Pixel array to Image
function to_image(matrix: Array<number>, width = 35) {
  let image = new Image(width, matrix.length / width).grey();

  matrix.map((item, index) => {
    if (item) {
      image.setPixel(index, [ 255 ]);
    }
  });

  return image;
}

// Subtract the background noise image
async function clean_image(img: Image) {
  let empty = (await Image.load(EMPTY)).grey();
  let data = img.grey();

  let cleaned = empty.subtractImage(data).multiply(10);

  cleaned.data.forEach((item, index) => {
    if (item < 50) {
      cleaned.setPixel(index, [ 0 ]);
    } else {
      cleaned.setPixel(index, [ 255 ]);
    }
  });

  cleaned = cleaned.crop({y : 24, x : 75, height : 35, width : 130});
  return cleaned;
}

// Average pixel value of horizontal top half
function htopavg(char_img: Image) {
  let temp_img = char_img.crop({
    y : 0,
    x : 0,
    height : Math.ceil(char_img.height / 2 + 1),
    width : char_img.width,
  });

  return (temp_img.getSum().reduce((acc, val) => acc + val) / 256);
}

// Average pixel value of horizontal bottom half
function hbotavg(char_img: Image) {
  let temp_img = char_img.crop({
    y : Math.ceil(char_img.height / 2 + 1),
    x : 0,
    height : 35 - Math.ceil(char_img.height / 2 + 1),
    width : char_img.width,
  });

  return (temp_img.getSum().reduce((acc, val) => acc + val) / 256);
}

// Average pixel value of vertical half
function vavg(char_img: Image) {
  let transformed_image = char_img.rotateRight();

  transformed_image = transformed_image.crop({
    y : 0,
    x : 0,
    height : Math.floor(transformed_image.height / 2 + 1),
    width : transformed_image.width,
  });

  return (transformed_image.getSum().reduce((acc, val) => acc + val) / 256);
}

export {solve_captcha, evaluate_captcha};
