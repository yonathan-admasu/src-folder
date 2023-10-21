import mongoose, { Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  alias: string;
  courthouse: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const departmentSchema = new mongoose.Schema<IDepartment>({
  name: String,
  alias: String,
  courthouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Courthouse",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Department = mongoose.model<IDepartment>("Department", departmentSchema);
export default Department;
