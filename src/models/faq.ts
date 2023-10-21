import mongoose, { Document } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  createdAt: Date;
}

const faqSchema = new mongoose.Schema<IFAQ>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FAQ = mongoose.model<IFAQ>("FAQ", faqSchema);
export default FAQ;
