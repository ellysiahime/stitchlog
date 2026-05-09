import dotenv from "dotenv";

dotenv.config();

async function main() {
  const { connectDB } = await import("../lib/mongodb");
  const db = await connectDB();
  const collection = db.collection("projects");
  const result = await collection.updateMany(
    {
      "properties.Status.name": {
        $in: ["Finish! 🛎", "finished"],
      },
    },
    { $set: { "properties.Status.name": "Finished" } }
  );

  console.log(
    JSON.stringify({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    })
  );

  process.exit(0);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
