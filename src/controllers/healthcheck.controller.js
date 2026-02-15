import { ApiResponse } from "../utils/api-response.js";

// the additional .controller in the name does nothing, it's just a reference to highlight that that is where all the logic of the application goes
// can also name it as healthcheck.js

const healthcheck = (req, res) => {
  try {
    // the .json ensures that response sends DATA as JSON
    // example output:
    /*
    {
    "statusCode": 200,
    "data": {
        "message": "Server is running"
    },
    "message": "Success",
    "success": true
    }
    */
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running" }));
  } catch (error) {}
};

export { healthcheck }; // export it so anyone can use it
