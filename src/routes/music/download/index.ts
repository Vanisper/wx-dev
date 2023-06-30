import axios from "axios";
import { Router } from "express";
import { kuwo } from "../../../config/music_api.json";

const downloadRouters = Router();
const downloadBaseUrl = kuwo.download.url;
const downloadHeaders = kuwo.download.headers;
const downloadParams = kuwo.download.params;

downloadRouters.get("/download", async (req, res) => {
  const { rid } = req.query;
  if (rid != undefined) {
    res.send(await getMp3Url(+rid));
  } else {
    res.send("请求参数不正确");
  }
});

const getMp3Url = async (rid: number, format?: string) => {
  downloadParams.rid = rid + "";
  downloadParams.format = "mp3|aac";
  if (format) {
    downloadParams.format = format;
  }
  let mp3Url = "";
  await axios
    .get(downloadBaseUrl, {
      headers: downloadHeaders,
      params: downloadParams,
    })
    .then((res) => {
      mp3Url = res.data;
    });

  return { mp3Url };
};

export { downloadRouters, getMp3Url };
