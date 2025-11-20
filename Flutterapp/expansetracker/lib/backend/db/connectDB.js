import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("📊 Connecting to MongoDB...");
    console.log("🔗 URI:", process.env.MONGO_URI ? "Found" : "Missing");
    
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    
    if (error.message.includes("quiesce mode")) {
      console.error("\n⚠️  MongoDB Cluster is in quiesce mode (paused/sleeping)");
      console.error("💡 Solutions:");
      console.error("   1. Go to MongoDB Atlas dashboard");
      console.error("   2. Wake up/resume your cluster");
      console.error("   3. Wait 1-2 minutes for cluster to be ready");
      console.error("   4. Try connecting again");
    } else if (error.message.includes("authentication failed")) {
      console.error("\n⚠️  Authentication failed");
      console.error("💡 Check your MongoDB connection string credentials");
    } else if (error.message.includes("timeout")) {
      console.error("\n⚠️  Connection timeout");
      console.error("💡 Check your internet connection and MongoDB Atlas network access");
    } else {
      console.error("\n💡 Troubleshooting:");
      console.error("   - Verify MONGO_URI in .env file");
      console.error("   - Check MongoDB Atlas cluster status");
      console.error("   - Ensure your IP is whitelisted in MongoDB Atlas");
    }
    
    console.error("\n🔄 Retrying connection in 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Retry once
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Connected on retry: ${conn.connection.host}`);
      return conn;
    } catch (retryError) {
      console.error("❌ Retry failed. Please fix MongoDB connection issues.");
      process.exit(1);
    }
  }
};