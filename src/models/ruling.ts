import mongoose, { Document, PopulatedDoc } from "mongoose";
import { IJudge } from "./judge";
import { IDepartment } from "./department";
import { ICounty } from "./county";

export interface IRuling extends Document {
  caseNumber: string;
  content: string;
  month: number;
  day: number;
  year: number;
  hearingDate: Date;
  verified: boolean;
  judge: PopulatedDoc<IJudge & Document>;
  department: PopulatedDoc<IDepartment & Document>;
  county: PopulatedDoc<ICounty & Document>;
  createdAt: Date;
  new: boolean;
  date: string;
}

const rulingSchema = new mongoose.Schema<IRuling>({
  caseNumber: {
    type: String,
    index: true,
  },
  content: {
    type: String,
  },
  month: {
    type: Number,
    index: true,
  },
  day: {
    type: Number,
    index: true,
  },
  year: {
    type: Number,
    index: true,
  },
  hearingDate: {
    type: Date,
    index: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  judge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Judge",
    index: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    index: true,
  },
  county: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "County",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  new: {
    type: Boolean,
    default: true,
    required: true,
  },
});

rulingSchema.virtual("date").get(function (this: IRuling) {
  return pad(this.month) + "/" + pad(this.day) + "/" + this.year;
});

function pad(d: number): string {
  return d < 10 ? "0" + d.toString() : d.toString();
}

rulingSchema.set("toObject", { virtuals: true });
rulingSchema.set("toJSON", { virtuals: true });

rulingSchema.index({ content: "text" });

const Ruling = mongoose.model<IRuling>("Ruling", rulingSchema);
export default Ruling;
