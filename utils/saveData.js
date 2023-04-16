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
      Bucket: process.env.AWS_BUCKET_NAME, // Replace with your bucket name
      Key: fileName,
      Body: videoBuffer,
      ContentType: "video/mp4",
    };

    s3.upload(params, async function (err, data) {
      if (err) {
        console.log(`*** saveData: ${err}`);
        return;
      }
      const fileUrl = data.Location;
      console.log(`[${new Date().toLocaleString()}] Step 2: Temp File ${fileName} uploaded to S3`);


      // Convert the video and save to S3
      const command = ffmpeg()
        .input(fileUrl)
        .outputOptions([
          "-c:v",
          "libvpx-vp9",
          "-crf",
          "30",
          "-vf",
          `scale=w=640:h=trunc(ow/a/2)*2`,
          "-c:a",
          "libopus",
          "-b:a",
          "96k",
          "-f",
          "webm",
          "-preset",
          "ultrafast",
          "-movflags",
          "+faststart",
          "-pix_fmt",
          "yuv420p",
          "-metadata",
          `title=${fileName}`,
          "-metadata",
          `author='ToNote Technologies Limited'`,
        ])
        .on("error", function (err) {
          console.log(`*** ${fileName}: ${err}`);
        })
        .on("end", async function () {
          console.log(`[${new Date().toLocaleString()}] Step 3: Temp File ${fileName} converted and saved to S3`);

          // Delete the original video from S3
          await s3
            .deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME, // Replace with your bucket name
              Key: fileName,
            })
            .promise();

          console.log(`[${new Date().toLocaleString()}] Step 4: Temp File ${fileName} deleted from S3`);

          // Perform any additional processing or save to database
          const newFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/converted_${fileName}`;
          saveToDB(schedule_id, newFileUrl, token);
          console.log(`[${new Date().toLocaleString()}] Step 5: Final File URL: ${newFileUrl}`);
        })
        .on('progress', function(progress) {
          // console.log(progress)
          console.log(`[${new Date().toLocaleString()}] Conversion Progress: frames: ${progress.frames}, currentFps: ${progress.currentFps}, currentKbps: ${progress.currentKbps}, targetSize: ${progress.targetSize}, timemark: ${progress.timemark}`);
        });

      command.on("error", function (err) {
        console.log(`*** ${fileName}: ${err}`);
      });

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME, // Replace with your bucket name
        Key: `converted_${fileName}`,
        Body: command.pipe(),
        ContentType: "video/mp4",
        Metadata: {
          title: fileName,
          author: 'ToNote Technologies Limited'
        }
      };

      const s3Upload = s3.upload(uploadParams);
      s3Upload.send((err) => {
        if (err) {
          console.log(`*** ${fileName}: ${err}`);
        }
      });
    });
  } catch (e) {
    console.log(`*** ${fileName}: ${e}`);
  }
};



// export const saveData = async (data, videoFile, schedule_id, token) => {
//   const fileName = `${videoFile}-${Date.now()}.mp4`;
//   const newFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/converted_${fileName}`;

//   try {
//     // Convert data to Blob and upload to S3
//     const videoBlob = new Blob(Array.from(data), { type: "video/mp4" });
//     const uploadResponse = await fetch(newFileUrl, {
//       method: "PUT",
//       body: videoBlob,
//       headers: {
//         "Content-Type": "video/mp4",
//         "x-amz-acl": "public-read",
//         "x-amz-storage-class": "REDUCED_REDUNDANCY",
//         "x-amz-meta-schedule_id": schedule_id,
//         "Authorization": `Bearer ${token}`
//       },
//     });
//     if (!uploadResponse.ok) {
//       console.log("*** saveData upload error:", uploadResponse.statusText);
//       return;
//     }
//     const fileUrl = uploadResponse.url;
//     console.log(`[${new Date().toLocaleString()}] Step 2: Temp File ${fileName} uploaded to S3`);

//     // Compress and save the video to S3
//     const command = ffmpeg()
//       .input(fileUrl)
//       .outputOptions([
//         "-c:v",
//         "libx264",
//         "-crf",
//         "28",
//         "-preset",
//         "medium",
//         "-profile:v",
//         "main",
//         "-level",
//         "3.1",
//         "-pix_fmt",
//         "yuv420p",
//         "-movflags",
//         "+faststart",
//         "-vf",
//         "scale=-2:720",
//         "-c:a",
//         "aac",
//         "-b:a",
//         "128k",
//         "-ac",
//         "2",
//       ])
//       .toFormat("mp4")
//       .on("error", function (err) {
//         console.log(`*** ${fileName} compression error:`, err);
//       })
//       .on("end", async function () {
//         console.log(`[${new Date().toLocaleString()}] Step 3: Temp File ${fileName} compressed and saved to S3`);

//         // Delete the original video from S3
//         await s3
//           .deleteObject({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: fileName,
//           })
//           .promise();

//         console.log(`[${new Date().toLocaleString()}] Step 4: Temp File ${fileName} deleted from S3`);

//         // Perform any additional processing or save to database
//         saveToDB(schedule_id, newFileUrl, token);
//         console.log(`[${new Date().toLocaleString()}] Step 5: Final File URL: ${newFileUrl}`);
//       });

//     command.on("error", function (err) {
//       console.log(`*** ${fileName} compression error:`, err);
//     });

//     const uploadParams = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `converted_${fileName}`,
//       Body: command.pipe(),
//       ContentType: "video/mp4",
//     };

//     const s3Upload = s3.upload(uploadParams);
//     s3Upload.send((err) => {
//       if (err) {
//         console.log(`*** ${fileName} upload error:`, err);
//       }
//     });
//   } catch (e) {
//     console.log(`*** ${fileName} error:`, e);
//   }
// };


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



// ffmpeg -i https://notary-session.s3.amazonaws.com/design_concept-1681538243877.mp4 -c:v libvpx-vp9 -crf 30 -b:v 500k -vf scale=640:360 -c:a libopus -b:a 96k -f webm -preset ultrafast output.webm
// ffmpeg -i https://notary-session.s3.amazonaws.com/design_concept-1681607375505.mp4 -c:v libvpx-vp9 -crf 30 -b:v 500k -vf scale=w=640:h=trunc(ow/a/2)*2 -c:a libopus -b:a 96k -f mp4 -preset ultrafast -movflags +faststart -profile:v baseline -pix_fmt yuv420p output.webm
// ffmpeg -i https://tonote-storage.s3.amazonaws.com/design_concept-1681608362619.mp4 -c:v libvpx-vp9 -crf 30 -b:v 500k -vf "scale=w=640:h=trunc(ow/a/2)*2" -c:a libopus -b:a 96k -f webm -preset ultrafast -movflags +faststart -profile:v -pix_fmt yuv420p output.webm
