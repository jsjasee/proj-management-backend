import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000; // define the PORT in the .env file, if does not exist then run on port 3000

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
