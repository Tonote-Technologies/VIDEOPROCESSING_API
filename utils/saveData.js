import { Buffer } from "buffer";
import { Blob } from "fetch-blob";
import AWS from "aws-sdk";
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
      console.log(`[${new Date().toLocaleString()}] Step 2: Temp File ${fileName} uploaded to S3`);

      // Get file size
      const fileSize = videoBlob.size;
      console.log(`[${new Date().toLocaleString()}] Step 2a: File size is ${fileSize} bytes`);

      // Convert the video and save to S3
      const startTime = new Date();
      
      const command = ffmpeg()
        .input(fileUrl)
        .outputOptions([
          "-c:v","libvpx-vp9","-crf","30","-b:v","500k","-vf",
          "scale=640:360","-c:a","libopus","-b:a","96k","-f","webm","-preset",
          "ultrafast",
        ])
        .toFormat("webm")
        .on("error", function (err) {
          console.log(`[${new Date().toLocaleString()}] *** ${fileName}: ${err}`);
        })
        .on("end", async function () {
          console.log(`[${new Date().toLocaleString()}] Step 3: Temp File ${fileName} converted and saved to S3`);

          // Delete the original video from S3
          await s3
            .deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileName,
            })
            .promise();

          console.log(`[${new Date().toLocaleString()}] Step 4: Temp File ${fileName} deleted from S3`);

          // Perform any additional processing or save to database
          const newFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/converted_${fileName}`;
          saveToDB(schedule_id, newFileUrl, token);
          console.log(`[${new Date().toLocaleString()}] Step 5: Final File URL: ${newFileUrl}`);

          // Get conversion time
          const endTime = new Date();
          const conversionTime = (endTime - startTime) / 1000;
          
          console.log(`[${new Date().toLocaleString()}] Step 5a: Conversion time was ${conversionTime} seconds`);
        });

      command.on("error", function (err) {
        console.log(`[${new Date().toLocaleString()}] *** ${fileName}: ${err}`);
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
          console.log(`[${new Date().toLocaleString()}] *** ${fileName}: ${err}`);
        }
      });
    });
  } catch (e) {
    console.log(`[${new Date().toLocaleString()}] *** ${fileName}: ${e}`);
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

// ffmpeg -i https://tonote-storage.s3.amazonaws.com/converted_affidavit_of_good_conduct-1683284839074.mp4 -c:v libx264 -c:a aac output.mp4


// ffmpeg -i https://notary-session.s3.amazonaws.com/design_concept-1681538243877.mp4 -c:v libvpx-vp9 -crf 30 -b:v 500k -vf scale=640:360 -c:a libopus -b:a 96k -f webm -preset ultrafast output.webm