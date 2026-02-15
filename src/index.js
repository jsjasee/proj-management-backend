import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000; // define the PORT in the .env file, if does not exist then run on port 3000

// instead of then & catch, can we just use await connectDB() then put the app.listen() after it? yes

/*
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error(`Mongo DB connection has errored: ${err}`);
    process.exit(); // as a precaution even though connectDB itself already has process.exit
  });
*/

try {
  await connectDB();
  app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
  });
} catch (err) {
  console.error(`Mongo DB connection has errored: ${err}`); // this actually doesn't catch any error because the errors is already being catched and 'swallowed' in the try-catch block in connectDB function, if i want to catch the error in the caller aka HERE, i will need to write 'throw error' in the connectDB function.
  process.exit();
}
