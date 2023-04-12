import { Buffer } from "buffer";
import {Blob} from 'fetch-blob'
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import AWS from "aws-sdk";
import * as fs from "fs";
import axios from 'axios';

import { path } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(path);

const __dirname = dirname(fileURLToPath(import.meta.url));

const videoPath = join(__dirname, "../video");
const dirPath = `${videoPath}/`;

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const saveToAWS = async (file, fileName, schedule_id, token) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${fileName}`,
    Body: fs.createReadStream(file),
  };
  s3.upload(params, function (s3Err,) {
    if (s3Err) throw s3Err;
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
    console.log(`File URL: ${url}`);
    sendEmail(schedule_id, url, token)
  });
};

const sendEmail = (schedule_id, video_link, token) => {

  var theBaseUrl = 'https://staging.gettonote.com/api/v1/schedule-recording-session/'+schedule_id;
  var bearer = 'Bearer ' + token;

  const Api = axios.create({
    withCredentials: false,
    headers: {
      Accept: 'application/json',
      'Authorization': bearer,
      'Content-type': 'application/json',
      'Access-Control-Allow-Origin': 'true',
    },
  });
  Api.put(theBaseUrl, {
     video_recording_file: video_link,
    })
    .then(function (response) {
      console.log(response.data.data.message);
    })
    .catch(function (error) {
      console.log("Error: ",error.response.data);
    });

}



const emptyDirectory = async (dirPath, removeSelf) =>  {
  try { 
    var files = fs.readdirSync(dirPath); 
    if (files.length > 0)
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath  + files[i];
        if (fs.statSync(filePath).isFile()){
          fs.unlinkSync(filePath);
          console.log("Deleted");
        }else{
          console.log("Not Done");
          emptyDirectory(filePath);
        }
      }
      if (removeSelf)
      fs.rmdirSync(dirPath);
    else
      console.log("Directory is now empty")
  }
  catch(e) { return; }
  
}

export const saveData = async (data, videoFile, schedule_id, token) => {
  const fileName = `${videoFile}-${Date.now()}.mp4`;
  const tempFilePath = `${dirPath}/temp-${fileName}`;
  const finalFilePath = `${dirPath}/${fileName}`;

  await mkdir(dirPath).catch(() => {});

  try {
    const videoBlob = new Blob(data, {
      type: "video/mp4",
    });
    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
    await writeFile(tempFilePath, videoBuffer).catch((e) => {
      console.log("*** writeFile", e);
      throw e;
    });

    ffmpeg(tempFilePath)
      .outputOptions([
        "-c:v",
        "libvpx-vp9",
        "-r",
        "5",
        "-crf",
        "20",
        "-b:v",
        "0",
        "-vf",
        "scale=1200:720",
        "-f",
        "mp4",
        "-preset",
        "ultrafast",
      ])
      .on("end", async () => {
        console.log(`*** File ${fileName} created`);
        await saveToAWS(finalFilePath, fileName, schedule_id, token);
        await emptyDirectory(dirPath);
      })
      .save(finalFilePath);
  } catch (e) {
    console.log("*** saveData", e);
  }
};

