require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./configs/db");

const PORT = process.env.PORT || 6000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Server startup failed", error.message);
    process.exitCode = 1;
});
