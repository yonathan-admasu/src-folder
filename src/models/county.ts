import mongoose, { Document } from "mongoose";

export interface ICounty extends Document {
  name: string;
  createdAt: Date;
}

const countySchema = new mongoose.Schema<ICounty>({
  name: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const County = mongoose.model<ICounty>("County", countySchema);
export default County;
