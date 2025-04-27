const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const AuthRouter = require("./Route/authRoute");

const app = express();
const PORT = 6969;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/api/v1", AuthRouter);

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");	
});

app.listen(PORT, () => {
    console.log(`Server Listening on PORT http://localhost:${PORT}`);
});