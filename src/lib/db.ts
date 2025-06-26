import {
  MongoClient,
  ServerApiVersion,
  Db,
  Collection,
  Document,
} from "mongodb";

export async function connectToDatabase(): Promise<Collection<Document>> {
  if (process.env.DB_URI) {
    const client = new MongoClient(process.env.DB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    try {
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
