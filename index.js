require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

console.log("Server is starting...");

// Middleware
app.use(cookieParser());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://task-management-applicat-6e6b6.web.app",
        "https://task-management-application07.netlify.app"
    ],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u4xyo.mongodb.net/?retryWrites=true&w=majority`;
console.log("🔗 Connecting to MongoDB...");
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    console.log(" Verifying JWT Token:", token);

    if (!token) {
        console.log(" No token found");
        return res.status(401).json({ message: "Unauthorized access" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err.message);
            return res.status(401).json({ message: "Unauthorized access" });
        }
        console.log("✅ Token verified:", decoded);
        req.user = decoded;
        next();
    });
};

// Logout API
app.post("/logout", (req, res) => {
    console.log("🚪 Logging out user");
    res.clearCookie("token", { httpOnly: true, secure: true });
    res.status(200).json({ message: "Logged out successfully" });
});

// JWT Token Generation
app.post("/jwt", async (req, res) => {
    const user = req.body;
    console.log("📜 Generating JWT for:", user);

    if (!user || !user.email) {
        console.log("Invalid user data:", user);
        return res.status(400).json({ error: "Invalid user data" });
    }

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "5h" });

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });

    console.log("✅ Token generated successfully");
    res.status(200).json({ success: true, token });
});

// Start Database Connection
async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const database = client.db("TaskDB");
        const tasksCollection = database.collection("tasks");

        // ✅ Get All Tasks
        app.get("/tasks", async (req, res) => {
            console.log(" Fetching all tasks...");
            const tasks = await tasksCollection.find().toArray();
            console.log(`Retrieved ${tasks.length} tasks`);
            res.send(tasks);
        });

        // ✅ Create a Task
        app.post("/tasks", async (req, res) => {
            console.log("Adding new task:", req.body);
            const { title, description, category } = req.body;

            if (!title || title.length > 50) {
                console.log("Invalid title length");
                return res.status(400).json({ error: "Title is required (max 50 chars)" });
            }
            if (description && description.length > 200) {
                console.log("Description too long");
                return res.status(400).json({ error: "Description max 200 chars" });
            }

            const newTask = {
                title,
                description: description || "",
                category: category || "To-Do",
                timestamp: new Date()
            };

            const result = await tasksCollection.insertOne(newTask);
            console.log("✅ Task added:", result);
            res.json(result);
        });

        // ✅ Update Task (Drag & Drop, Reorder, Edit)
        app.put("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            console.log("Updating task:", id, req.body);

            if (!ObjectId.isValid(id)) {
                console.log("Invalid Task ID");
                return res.status(400).json({ error: "Invalid Task ID" });
            }

            const updateData = {};
            if (req.body.title) updateData.title = req.body.title;
            if (req.body.description) updateData.description = req.body.description;
            if (req.body.category) updateData.category = req.body.category;

            const result = await tasksCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );

            console.log("Task updated:", result);
            res.json(result);
        });

        // ✅ Delete a Task
        app.delete("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            console.log("Deleting task:", id);

            if (!ObjectId.isValid(id)) {
                console.log("Invalid Task ID");
                return res.status(400).json({ error: "Invalid Task ID" });
            }

            const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
            console.log("Task deleted:", result);
            res.json(result);
        });

    } catch (error) {
        console.error("Connection error:", error);
    }
}

run().catch(console.dir);

// Start Server
app.get("/", (req, res) => {
    console.log("Root route accessed");
    res.send("Task Management API is running");
});

app.listen(port, () => console.log(`Server running on port: ${port}`));
