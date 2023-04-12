import { Buffer } from "buffer";
import { Blob } from "fetch-blob";
// import AWS from "aws-sdk";
import AWS from "aws-sdk";
// const s3 = new AWS.S3();
import axios from "axios";
import { path } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(path);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});


export const saveData = async (data, videoFile, schedule_id, token) => {
  const fileName = `${videoFile}-${Date.now()}.mp4`;

  try {
    const videoBlob = new Blob(Array.from(data), {
      type: "video/mp4",
    });
    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: videoBuffer,
      ContentType: "video/mp4",
    };

    s3.upload(params, async function (err, data) {
      if (err) {
        console.log("*** saveData", err);
        return;
      }
      const fileUrl = data.Location;
      console.log(`*** File ${fileName} uploaded to S3`);
      console.log(`*** File URL: ${fileUrl}`);

      // Convert the video and save to S3
      const command = ffmpeg()
      .input(fileUrl)
      .outputOptions([
        // "-c:v libx264",
        // "-preset medium",
        // "-tune film",
        // "-crf 18",
        // "-vf scale=1280:720",
        // "-r 30",
        // "-b:v 1500k",
        // "-f webm"
        '-c:v', 'libvpx-vp9',
        '-crf', '30',
        '-b:v', '0',
        '-vf', 'scale=-2:720', // -2:720 keeps aspect ratio and limits height to 720 pixels
        '-c:a', 'libopus',
        '-b:a', '96k',
        '-f', 'webm',
        '-deadline', 'realtime',
        '-preset', 'ultrafast',
      ])
      .toFormat("webm")
      .on("error", function (err) {
        console.log("*** saveData", err);
      })
      .on("end", async function () {
        console.log(`*** File ${fileName} converted and saved to S3`);
        // Delete the original video from S3
        await s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
          })
          .promise();
        console.log(`*** File ${fileName} deleted from S3`);

        // Perform any additional processing or save to database
        

      });

      command.on("error", function (err) {
        console.log("*** saveData", err);
      });

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `converted_${fileName}`,
        Body: command.pipe(),
        ContentType: "video/mp4",
      };

      const s3Upload = s3.upload(uploadParams);
      s3Upload.send((err) => {
        if (err) {
          console.log("*** saveData", err);
        } else {
          console.log(`*** File converted-${fileName} uploaded`);
          let newfileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/converted_${fileName}`
          saveToDB(schedule_id, newfileUrl, token)
          console.log(`New File URL: ${newfileUrl}`);
        }
      });
    });
  } catch (e) {
    console.log("*** saveData", e);
  }
};

const saveToDB = (schedule_id, video_link, token) => {

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
