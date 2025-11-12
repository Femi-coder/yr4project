import { MongoClient } from "mongodb";


const uri =
  "mongodb+srv://Femi:femi_123@ecowheelsdublin.zpsyu.mongodb.net/studentcollaboration?retryWrites=true&w=majority";

if (!uri) {
  throw new Error("No MONGODB_URI provided");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;