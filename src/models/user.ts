import { Schema, model } from "mongoose";
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  allowCopy: boolean;
  joined: Date;
  fullName: string;
}

const UserSchema: Schema<IUser> = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  allowCopy: {
    type: Boolean,
    required: true,
    default: false,
  },
  joined: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

const User = model<IUser>("User", UserSchema);

export default User;
