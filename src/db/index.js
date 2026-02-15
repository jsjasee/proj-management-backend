import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected.");
  } catch (error) {
    console.error("❌ MongoDB connection error: ", error);
    process.exit(); // exit the whole process? what does this mean? how to know when to use async? as long as some external service is required?
  }
};

export default connectDB;
