import {
  MongoClient,
  ServerApiVersion,
  Db,
  Collection,
  Document,
} from "mongodb";

let client: MongoClient | null = null;

export async function connectToDatabase(): Promise<Collection<Document>> {
  if (process.env.DB_URI) {
    if (!client) {
      client = new MongoClient(process.env.DB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
    }

    try {
      console.log("Before Database connect");
      await client.connect();
      console.log(">>>>>>CONNECTED TO THE DATABASE<<<<<<");
      const db: Db = client.db("SeniorBio");
      return db.collection(
        process.env.NODE_ENV === "production" ? "ProdBios" : "DevBios"
      );
    } catch (err) {
      console.error(err);
    }
  } else {
    throw new Error("Client URI not found");
  }
}
