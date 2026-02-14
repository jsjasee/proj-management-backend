import express from "express";
import cors from "cors";

const app = express();

// basic configurations
app.use(express.json({ limit: "16kb" })); // anyone can send the website json data? then specify a limit.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // the arguments in the url like "jason%20lemon"?
app.use(express.static("public")); // make the application publicly viewable? now the whole public folder is available?

// cors configuration (cors is something to be handled in the backend. cors is just indicating i am allowing myself to communicate with what? what url is backend allowed to communicate?)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173", // if the CORS_ORIGIN url is separated by commas, split it by the "," if not then the origin url is just the local host with the port 5173?? what is the CORS_ORIGIN???
    credentials: true, // what is this for?
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // different http methods that we will support for CORS
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// below means use the app, then the GET method (there's only get, post, put/patch & delete), then GET from which url (this is the ROUTES), followed by callback (request & response) -> data sent from client is request, data sent from server is response.
app.get("/", (req, res) => {
  res.send("Welcome to basecampy!");
});

app.get("/gnarly", (req, res) => {
  res.send("this is gnarly.");
});

// export { app };
// or if you use 'default' keyword no need {}
export default app;
