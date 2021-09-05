const { Image } = require("image-js");

let res = {
  8: [155.1953125, 72.357421875, 82.337890625],
  m: [163.0359375, 77.06953125, 74.6703125],
  9: [126.85078125, 54.678515625, 72.971484375],
  0: [133.74479166666666, 64.79036458333333, 71.78515625],
  5: [112.1396484375, 46.2041015625, 69.181640625],
  6: [129.49869791666666, 67.57942708333333, 68.91015625],
  h: [125.26171875, 73.859375, 66.375],
  d: [138.228515625, 52.396484375, 66.369140625],
  b: [132.49921875, 81.31223958333334, 64.91666666666667],
  3: [104.43098958333333, 31.145833333333332, 58.4609375],
  4: [115.64899553571429, 34.123325892857146, 57.681361607142854],
  w: [151.20089285714286, 74.38671875, 56.96763392857143],
  7: [82.868359375, 40.184765625, 56.178515625],
  f: [82.1689453125, 62.1884765625, 55.1953125],
  2: [112.09309895833333, 48.134765625, 51.1328125],
  k: [106.58203125, 80.68359375, 48.80859375],
  n: [105.1953125, 52.264322916666664, 46.272135416666664],
  p: [129.22620738636363, 78.42613636363636, 43.89311079545455],
  g: [146.57161458333334, 62.625651041666664, 43.637369791666664],
  q: [131.35435267857142, 49.400111607142854, 42.404017857142854],
  1: [82.66573660714286, 34.408482142857146, 39.548549107142854],
  t: [67.435546875, 37.2138671875, 35.71484375],
  o: [95.3125, 47.40625, 35.427734375],
  u: [105.94775390625, 48.9755859375, 33.2333984375],
  e: [93.4541015625, 48.47607421875, 32.73388671875],
  a: [106.31640625, 47.1625, 29.5765625],
  y: [87.88541666666667, 53.9296875, 29.294270833333332],
  s: [79.9359375, 36.7703125, 29.1765625],
  r: [58.591145833333336, 48.604166666666664, 28.962239583333332],
  v: [73.40764508928571, 41.345703125, 28.919642857142858],
  x: [74.070703125, 37.684765625, 26.489453125],
  i: [56.259114583333336, 18.30859375, 26.298177083333332],
  j: [80.07595486111111, 7.107638888888889, 25.09982638888889],
  c: [62.75390625, 39.84375, 24.90234375],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

window.onload = async () => {
  await sleep(100);
  let captcha_blob_url = document.getElementsByClassName(
    "captcha-image-dimension"
  )[0].currentSrc;
  while (!captcha_blob_url) {
    captcha_blob_url = document.getElementsByClassName(
      "captcha-image-dimension"
    )[0].currentSrc;
  }
  let captcha_img = await Image.load(captcha_blob_url);
  solve_captcha(captcha_img).then((captcha_value) => {
    let captcha = "";
    captcha_value.map((item) => {
      let sim = Object.entries(res).map((item2) => {
        return [
          item2[0],
          Math.abs(item2[1][0] - item[0]) +
            3 * Math.abs(item2[1][1] - item[1]) +
            2 * Math.abs(item2[1][2] - item[2]),
        ];
      });
      let sorted_values = sim.sort((a, b) => a[1] - b[1]);
      captcha += sorted_values[0][0];
    });
    document.getElementById("captchaEnter").value = captcha;
    document.getElementById("captchaEnter").dispatchEvent(new Event("input"));
  });
};

async function solve_captcha(img) {
  let emptyImageURL = chrome.runtime.getURL("empty.jpg");
  let sampleJ = chrome.runtime.getURL("sample-j.png");
  let empty = (await Image.load(emptyImageURL)).grey();
  let data = img.grey();
  let jd = (await Image.load(sampleJ)).grey();

  let cleaned = empty.subtractImage(data).multiply(10);

  cleaned.data.map((item, index) => {
    if (item < 50) {
      cleaned.setPixel(index, [0]);
    } else {
      cleaned.setPixel(index, [255]);
    }
  });

  cleaned = cleaned.crop({ y: 24, x: 75, height: 35, width: 130 });

  let counter = 0;
  let matrix = [];
  let matrix_list = [];

  for (i = 0; i < 130; i++) {
    let columnEmpty = true;
    for (j = 0; j < 35; j++) {
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

  let averages = [];

  matrix_list.map((char_mat, index) => {
    let temp_img = to_image(char_mat, 35).rotateRight().flipX();
    let average = temp_img.sum / 256;
    let vAvg = vavg(temp_img);
    let hAvg = havg(temp_img);

    if (average > 165) {
      let clean_char = to_image(cutoff_j(char_mat)).rotateRight().flipX();
      averages.push([clean_char.sum / 256, vavg(clean_char), havg(clean_char)]);
      averages.push([jd.sum / 256, vavg(jd), havg(jd)]);
    } else {
      averages.push([average, vAvg, hAvg]);
    }
  });

  return averages;
}

function to_image(matrix, width = 35) {
  let image = new Image(width, matrix.length / width).grey();

  matrix.map((item, index) => {
    if (item) {
      image.setPixel(index, [255]);
    }
  });

  return image;
}

function cutoff_j(matrix) {
  matrix.splice(matrix.length - 105, 105);
  for (i = 0; i <= 5; i++) {
    for (j = 0; j <= 6; j++) {
      matrix[matrix.length - 35 * j - i - 1] = 0;
    }
  }

  let col_counter = 0;
  for (i = 0; i < matrix.length / 35; i++) {
    let columnEmpty = true;
    for (j = 0; j < 35; j++) {
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

function havg(char_img) {
  return (
    char_img.crop({
      y: 0,
      x: 0,
      height: Math.floor(char_img.height / 2),
      width: char_img.width,
    }).sum / 256
  );
}

function vavg(char_img) {
  char_img = char_img.rotateRight();
  return (
    char_img.crop({
      y: 0,
      x: 0,
      height: Math.floor(char_img.height / 2),
      width: char_img.width,
    }).sum / 256
  );
}
