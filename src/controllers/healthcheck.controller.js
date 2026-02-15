import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
// the additional .controller in the name does nothing, it's just a reference to highlight that that is where all the logic of the application goes
// can also name it as healthcheck.js

/*
const healthcheck = (req, res) => {
  try {
    // the .json ensures that response sends DATA as JSON
    
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running" }));
  } catch (error) {
    next(error)
  }
};
*/

// version 2, you don't have to use 'catch' and 'next' keyword.
// this general function can copy and paste into many projects!
const healthcheck = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { message: "Server is running very well" }));
});

export { healthcheck }; // export it so anyone can use it

// example output of response:
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
