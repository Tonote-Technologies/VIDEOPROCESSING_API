import mongoose from "mongoose";
import bcrypt from "bcryptjs";
// import Inc from "mongoose-sequence";

const Schema = mongoose.Schema;
export { Schema, mongoose, bcrypt };

// @desc Generate auto increament id
// const AutoIncreament = Inc(mongoose);
// userSchema.plugin(AutoIncreament, {
//   inc_field: "user_ticket",
//   id: "userTickets",
//   start_seq: 1,
// });
