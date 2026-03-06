/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

global.tempatDB = "./database/database.json";

let DataBase;

if (/mongo/.test(global.tempatDB)) {
  DataBase = class mongoDB {
    constructor(url, options = { useNewUrlParser: true, useUnifiedTopology: true }) {
      this.url = url;
      this.data = {};
      this._model = {};
      this.options = options;
    }

    read = async () => {
      mongoose.connect(this.url, { ...this.options });
      this.connection = mongoose.connection;
      try {
        const schema = new mongoose.Schema({
          data: { type: Object, required: true, default: {} },
        });
        this._model = mongoose.model("data", schema);
      } catch {
        this._model = mongoose.model("data");
      }
      this.data = await this._model.findOne({});
      if (!this.data) {
        new this._model({ data: {} }).save();
        this.data = await this._model.findOne({});
      } else return this?.data?.data || this?.data;
    };

    write = async (data) => {
      if (this.data && !this.data.data) return new this._model({ data }).save();
      this._model.findById(this.data._id, (err, docs) => {
        if (!err) {
          if (!docs.data) docs.data = {};
          docs.data = data;
          return docs.save();
        }
      });
    };
  };
} else if (/json/.test(global.tempatDB)) {
  DataBase = class dataBase {
    data = {};
    file = path.join(global.tempatDB);

    read = async () => {
      const dirname = path.dirname(this.file);
      if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
      if (fs.existsSync(this.file)) {
        try {
          return JSON.parse(fs.readFileSync(this.file, "utf-8"));
        } catch {
          fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
          return this.data;
        }
      } else {
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
        return this.data;
      }
    };

    write = async (data) => {
      this.data = data ?? global.db;
      const dirname = path.dirname(this.file);
      if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
      return this.file;
    };
  };
}

export default DataBase;
