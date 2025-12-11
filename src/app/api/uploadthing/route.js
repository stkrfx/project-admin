import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export the handler for GET and POST requests
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});