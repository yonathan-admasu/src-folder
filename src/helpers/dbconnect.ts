import mongoose, { ConnectOptions } from "mongoose";
import { appConfig } from "../config/keys";

interface MongoOptions extends ConnectOptions {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
  // useFindAndModify: boolean;
  // useCreateIndex: boolean;
  // poolSize: number;
}

const mongoOptions: MongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
  // useCreateIndex: true,
  autoIndex: false,
  // poolSize: 2,
};

const connectDB = (): void => {
  mongoose
    .connect(appConfig.mongoURI, mongoOptions)
    .then(() => {
      console.log("MongoDB Connected...");
    })
    .catch((err) => {
      console.log("MongoDB Connect Error:", err);
    });
};

export default connectDB;
