import mongoose, { Document } from "mongoose";

export interface IContactUs extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdat: Date;
}

const contactusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
});

const ContactUs = mongoose.model<IContactUs>("Contactus", contactusSchema);
export default ContactUs;
