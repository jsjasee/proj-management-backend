import express from "express";
import cors from "cors";
// import the routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";

const app = express();

// basic configurations
app.use(express.json({ limit: "16kb" })); // anyone can send the website json data? then specify a limit.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // the arguments in the url like "jason%20lemon"?
app.use(express.static("public")); // NOT CORS-related! Serves files from the "public" folder directly via URL (e.g., /images/logo.png serves public/images/logo.png). For static assets like images, CSS, JS. (everything in public folder is exposed.)
app.use(cookieParser()); // now we have access to cookies 🍪

// app.use("/images", express.static("public/images")); // now if client make a reques to get picture like http://your-server.com/images/abc.png, .static allows express to go into our images folder on our device/disk to pick it out and serve it to the client (here you are ONLY exposing the images folder)

// cors configuration (cors is something to be handled in the backend. cors is just indicating i am allowing myself to communicate with what? what url is backend allowed to communicate?)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173", // if the CORS_ORIGIN url is separated by commas, split it by the "," if not then the origin url is just the local host with the port 5173?? what is the CORS_ORIGIN???
    credentials: true, // what is this for?
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // different http methods that we will support for CORS
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// import the routes (must use USE NOT GET!) - check Proj resource docs (PRD) for the routes.
app.use("/api/v1/healthcheck", healthcheckRouter); // if got extra stuff like you want to hit "/api/v1/healthcheck/instagram, you DON'T need to change this, you just create another '/instagram' in healthcheckRouter function"
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks/", taskRouter);

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
