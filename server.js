import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));



// ----------------- MongoDB Connection -----------------
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let usersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("travel_bunk");
    usersCollection = db.collection("users");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
connectDB();

// ----------------- Signup API -----------------
app.post("/api/signup", async (req, res) => {
  const data = req.body;
  if (!data.firstName || !data.email || !data.password)
    return res.json({ success: false, message: "Missing fields" });

  const existingUser = await usersCollection.findOne({ email: data.email });
  if (existingUser)
    return res.json({ success: false, message: "Email already exists" });

  const newUser = {
    firstName: data.firstName,
    lastName: data.lastName || "",
    email: data.email,
    phone: data.phone || "",
    age: data.age || "",
    travelStyle: data.travelStyle || "",
    password: data.password,
    aadhaar: data.aadhaar || "",
    newsletter: data.newsletter || false,
    college: data.college || "",
    trips: [],
    blogs: [],
    badges: [],
    totalDistance: 0,
    rating: "N/A",
    bio: data.bio || "",
  };

  await usersCollection.insertOne(newUser);
  console.log("👤 New user registered:", data.email);
  res.json({ success: true, user: newUser });
});

// ----------------- Login API -----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Missing fields" });

  const user = await usersCollection.findOne({ email, password });
  if (!user)
    return res.json({ success: false, message: "Invalid email or password" });

  res.json({ success: true, user });
});

// ----------------- Update Profile API -----------------
app.post("/api/update-profile", async (req, res) => {
  const { email, ...updates } = req.body;
  if (!email)
    return res.json({ success: false, message: "Missing email" });

  const result = await usersCollection.updateOne({ email }, { $set: updates });
  if (result.modifiedCount === 0)
    return res.json({ success: false, message: "No changes or user not found" });

  const updatedUser = await usersCollection.findOne({ email });
  console.log("✏️ Profile updated:", email);
  res.json({ success: true, user: updatedUser });
});

// ----------------- Add Blog API -----------------
app.post("/api/add-blog", async (req, res) => {
  const { email, blog } = req.body;
  if (!email || !blog?.title || !blog?.content)
    return res.json({ success: false, message: "Missing fields" });

  const blogData = { ...blog, date: new Date().toLocaleString() };

  await usersCollection.updateOne({ email }, { $push: { blogs: blogData } });

  console.log("📝 Blog added by:", email);
  const user = await usersCollection.findOne({ email });
  res.json({ success: true, blogs: user.blogs });
});

// ----------------- Fetch User Blogs -----------------
app.get("/api/blogs/:email", async (req, res) => {
  const email = req.params.email;
  const user = await usersCollection.findOne({ email });
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, blogs: user.blogs || [] });
});

// ----------------- Get All Users -----------------
app.get("/api/users", async (req, res) => {
  const users = await usersCollection.find({}).toArray();
  res.json(users);
});

// ----------------- Add Trip API -----------------
app.post("/api/add-trip", async (req, res) => {
  const { email, college, date, destination } = req.body;
  if (!email || !date || !destination)
    return res.json({ success: false, message: "Missing fields" });

  const newTrip = {
    college,
    destination,
    date,
    createdAt: new Date().toLocaleString(),
  };

  await usersCollection.updateOne({ email }, { $push: { trips: newTrip } });

  console.log("🚌 Trip added for:", email);
  const user = await usersCollection.findOne({ email });
  res.json({ success: true, trips: user.trips });
});
app.get("/google376b52ea58ffbfb3.html", (req, res) => {
  res.type("text/plain");
  res.send("google-site-verification: google376b52ea58ffbfb3.html");
});

// ✅ Serve index.html for homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------- Find Users By Trip -----------------
app.post("/api/find-users-by-trip", async (req, res) => {
  const { date, destination } = req.body;
  if (!date || !destination)
    return res.json({ success: false, message: "Missing date or destination" });

  const users = await usersCollection
    .find({
      trips: { $elemMatch: { date, destination: { $regex: new RegExp(`^${destination}$`, "i") } } },
    })
    .toArray();

  const matchedUsers = users.map((u) => ({
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    age: u.age,
    travelStyle: u.travelStyle,
    college: u.college || "",
    trips: u.trips.filter(
      (t) => t.date === date && t.destination.toLowerCase() === destination.toLowerCase()
    ),
  }));

  console.log("🔎 Search result count:", matchedUsers.length);
  res.json({ success: true, users: matchedUsers });
});



// ----------------- Serve HTML Pages -----------------
const pages = [
  "index",
  "find-companion",
  "explore-trips",
  "profile",
  "about",
  "contact",
  "blog",
  "signin",
  "signup",
  "chatbot",
];

pages.forEach((page) =>
  app.get(`/${page === "index" ? "" : page}`, (req, res) =>
    res.sendFile(path.join(__dirname, "public", `${page}.html`))
  )
);

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);




