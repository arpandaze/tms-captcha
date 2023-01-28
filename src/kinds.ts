import {KindEntry} from "../src/interface";

const kinds: {[key: string]: KindEntry} = {
  bold : {write_name : "bold_data.json", data_path : "./scripts/images_bold/"},
  slim : {write_name : "slim_data.json", data_path : "./scripts/images_slim/"},
};

export {kinds};
