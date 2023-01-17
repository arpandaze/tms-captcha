import {Image} from "image-js";

let SAMPLE_J = "assets/sample-j.png";
let EMPTY = "assets/empty.jpg";

if (typeof window === "object") {
  SAMPLE_J = chrome.runtime.getURL(SAMPLE_J);
  EMPTY = chrome.runtime.getURL(EMPTY);
} else {
  SAMPLE_J = `./src/${SAMPLE_J}`;
  EMPTY = `./src/${EMPTY}`;
}

async function evaluate_captcha(img: Image): Promise<Array<Array<number>>> {
  let jd = (await Image.load(SAMPLE_J)).grey();

  let cleaned = await clean_image(img);

  let counter = 0;
  let matrix = [];
  let matrix_list = [];

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

    if (average > 165) {
      let clean_char = to_image(cutoff_j(char_mat)).rotateRight().flipX();

      let clean_char_sum_avg =
          clean_char.getSum().reduce((acc, val) => {return acc + val}) / 256;

      averages.push([
        clean_char_sum_avg,
        vavg(clean_char),
        htopavg(clean_char),
        hbotavg(clean_char),
        clean_char.width,
      ]);

      let jd_char_sum_avg =
          jd.getSum().reduce((acc, val) => {return acc + val}) / 256;

      averages.push([
        jd_char_sum_avg,
        vavg(jd),
        htopavg(jd),
        hbotavg(jd),
        jd.width,
      ]);
    } else {
      averages.push([ average, vAvg, hAvg, hbtAvg, char_mat.length / 35 ]);
    }
  });

  return averages;
}

function to_image(matrix: Array<number>, width = 35) {
  let image = new Image(width, matrix.length / width).grey();

  matrix.map((item, index) => {
    if (item) {
      image.setPixel(index, [ 255 ]);
    }
  });

  return image;
}

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

function cutoff_j(matrix: Array<number>) {
  matrix.splice(matrix.length - 105, 105);
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 6; j++) {
      matrix[matrix.length - 35 * j - i - 1] = 0;
    }
  }

  let col_counter = 0;
  for (let i = 0; i < matrix.length / 35; i++) {
    let columnEmpty = true;
    for (let j = 0; j < 35; j++) {
      if (matrix[matrix.length - i * 35 - j - 1]) {
        columnEmpty = false;
        break;
      }
    }
    if (!columnEmpty) {
      break;
    }
    col_counter++;
  }

  matrix.splice(matrix.length - col_counter * 35, col_counter * 35);
  return matrix;
}

function htopavg(char_img: Image) {
  let temp_img = char_img.crop({
    y : 0,
    x : 0,
    height : Math.ceil(char_img.height / 2 + 1),
    width : char_img.width,
  });

  return (temp_img.getSum().reduce((acc, val) => acc + val) / 256);
}

function hbotavg(char_img: Image) {
  let temp_img = char_img.crop({
    y : Math.ceil(char_img.height / 2 + 1),
    x : 0,
    height : 35 - Math.ceil(char_img.height / 2 + 1),
    width : char_img.width,
  });

  return (temp_img.getSum().reduce((acc, val) => acc + val) / 256);
}

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

export {evaluate_captcha, clean_image};
