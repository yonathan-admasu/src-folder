import mongoose, { Document } from "mongoose";

export interface IStaticcontent extends Document {
  welcome: string;
  text: string;
  createdAt: Date;
}

const StaticcontentSchema = new mongoose.Schema<IStaticcontent>({
  welcome: String,
  text: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Staticcontent = mongoose.model<IStaticcontent>(
  "Staticcontent",
  StaticcontentSchema
);
export default Staticcontent;
