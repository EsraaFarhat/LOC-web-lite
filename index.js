const server = require("./app");

const port = process.env.PORT || 3000;

server.listen(port, "10.42.0.253", null, () => { 
  console.log(`Server is listening at http://localhost:${port}`);
});
