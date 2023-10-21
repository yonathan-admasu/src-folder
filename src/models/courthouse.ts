import mongoose, { Document } from "mongoose";

export interface ICourthouse extends Document {
  name: string;
  address: string;
  county: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const courthouseSchema = new mongoose.Schema<ICourthouse>({
  name: String,
  address: String,
  county: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "County",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Courthouse = mongoose.model<ICourthouse>("Courthouse", courthouseSchema);
export default Courthouse;
