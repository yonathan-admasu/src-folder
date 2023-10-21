import mongoose, { Document, Schema } from "mongoose";

export interface ISubscription extends Document {
  firstname: string;
  lastname: string;
  email: string;
  joined: Date;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  joined: {
    type: Date,
    default: Date.now,
  },
});

const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);

export default Subscription;
