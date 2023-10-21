import mongoose, { Document, Schema } from "mongoose";

export interface IScraperLog extends Document {
  scraperName: string;
  logText: string;
  logType: string;
  createdAt: Date;
}

const scraperlogSchema: Schema = new Schema({
  scraperName: String,
  logText: String,
  logType: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ScraperLog = mongoose.model<IScraperLog>("Scraperlog", scraperlogSchema);
export default ScraperLog;
