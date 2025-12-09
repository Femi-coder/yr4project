import { MongoClient, ServerApiVersion } from "mongodb";

const uri = "mongodb+srv://Femi:femi_123@ecowheelsdublin.zpsyu.mongodb.net/studentcollaboration?retryWrites=true&w=majority";

if (!uri) {
  throw new Error("No MONGODB_URI provided");
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
