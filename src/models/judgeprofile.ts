import mongoose, { Schema, Document } from "mongoose";
import { IJudge } from "./judge"; // Import the Judge model or interface

export interface IJudgeProfile extends Document {
  judge: IJudge["_id"];
  alternateName: string;
  slug: string;
  profile: string;
  published: boolean;
}

const judgeProfileSchema: Schema = new Schema({
  judge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Judge",
  },
  alternateName: String,
  slug: String,
  profile: String,
  published: {
    type: Boolean,
    default: false,
  },
});

const JudgeProfile = mongoose.model<IJudgeProfile>(
  "JudgeProfile",
  judgeProfileSchema
);

export default JudgeProfile;
