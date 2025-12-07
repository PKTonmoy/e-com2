import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // MongoDB connection options for stability
    const options = {
      autoIndex: true,
      maxPoolSize: 10,         // Maximum number of connections in the pool
      minPoolSize: 2,          // Minimum connections to maintain
      serverSelectionTimeoutMS: 10000, // Timeout for server selection
      socketTimeoutMS: 45000,  // Socket timeout
      heartbeatFrequencyMS: 10000, // How often to check server health
      retryWrites: true,       // Retry failed writes
      retryReads: true,        // Retry failed reads
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from MongoDB');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect to MongoDB...');
        mongoose.connect(process.env.MONGO_URI, options).catch((err) => {
          console.error('Reconnection failed:', err.message);
        });
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('Mongoose reconnected to MongoDB');
    });

    // Handle process termination gracefully
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Don't exit immediately, retry after delay
    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

export default connectDB;
