import mongoose, { Document } from "mongoose";

export interface IJudge extends Document {
  name: string;
  title: string;
  phone: string;
  createdAt: Date;
}

const judgeSchema = new mongoose.Schema<IJudge>({
  name: String,
  title: String,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Judge = mongoose.model<IJudge>("Judge", judgeSchema);
export default Judge;
