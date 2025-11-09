import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ----------------- MongoDB Connection -----------------
const uri = process.env.MONGO_URI;
let client;
let usersCollection;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 45000,
      });
      await client.connect();
      console.log("✅ Connected to MongoDB Atlas");
    }
    const db = client.db("travel_bunk");
    usersCollection = db.collection("users");

    // ✅ Create index for faster trip searches
    await usersCollection.createIndex({ "trips.destination": 1 });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
await connectDB();

// ----------------- Helper: Aadhaar Verhoeff Algorithm -----------------
function verhoeffCheck(aadhaar) {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];

  const p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8]
  ];

  let c = 0;
  aadhaar.split('').reverse().forEach((num, i) => {
    c = d[c][p[i % 8][parseInt(num, 10)]];
  });
  return c === 0;
}

// ----------------- ROUTES -----------------

// ✅ Ping (for health check / wake up)
app.get("/api/ping", (req, res) => res.json({ success: true, message: "pong" }));

// ✅ Signup
app.post("/api/signup", async (req, res) => {
  try {
    const data = req.body;
    if (!data.firstName || !data.email || !data.password)
      return res.json({ success: false, message: "Missing required fields" });

    if (!/^\d{12}$/.test(data.aadhaar))
      return res.json({ success: false, message: "Invalid Aadhaar format" });
    if (!verhoeffCheck(data.aadhaar))
      return res.json({ success: false, message: "Invalid Aadhaar checksum" });

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
      aadhaar: data.aadhaar,
      newsletter: data.newsletter || false,
      college: data.college || "",
      trips: [],
      blogs: [],
      totalDistance: 0,
      rating: (Math.random() * (5 - 3.8) + 3.8).toFixed(1),
      badges: ["🎒 New Explorer", "🧭 Joined TravelBuddy"],
      bio: data.bio || "Travel enthusiast. Love exploring new cultures!",
      img: data.img || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
    };

    await usersCollection.insertOne(newUser);
    console.log("👤 New user registered:", data.email);
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Missing fields" });

  const user = await usersCollection.findOne({ email, password });
  if (!user)
    return res.json({ success: false, message: "Invalid email or password" });

  res.json({ success: true, user });
});

// ✅ Update Profile
app.post("/api/update-profile", async (req, res) => {
  try {
    const { email, ...updates } = req.body;
    if (!email) return res.json({ success: false, message: "Missing email" });
    if (updates._id) delete updates._id;

    const result = await usersCollection.updateOne({ email }, { $set: updates });
    if (result.modifiedCount === 0)
      return res.json({ success: false, message: "No changes or user not found" });

    const updatedUser = await usersCollection.findOne({ email });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add Trip
app.post("/api/add-trip", async (req, res) => {
  const { email, college, date, destination, distance, description } = req.body;
  if (!email || !date || !destination)
    return res.json({ success: false, message: "Missing fields" });

  const numericDistance = parseFloat(distance) || 0;
  const newTrip = {
    college,
    destination,
    date,
    distance: numericDistance,
    description: description || "",
    createdAt: new Date().toLocaleString(),
  };

  try {
    await usersCollection.updateOne({ email }, { $push: { trips: newTrip } });

    const user = await usersCollection.findOne({ email });
    const totalDistance = (user.trips || []).reduce(
      (sum, t) => sum + (parseFloat(t.distance) || 0), 0
    );

    const tripCount = user.trips.length;
    let badges = ["🎒 New Explorer", "🧭 Joined TravelBuddy"];
    if (tripCount >= 3) badges.push("🚗 Frequent Traveler");
    if (tripCount >= 5) badges.push("🌍 Globetrotter");
    if (totalDistance > 2000) badges.push("🏆 Long Journey Expert");

    const rating = Math.min(5, (4 + tripCount * 0.1).toFixed(1));
    await usersCollection.updateOne(
      { email },
      { $set: { totalDistance, badges, rating } }
    );

    const updatedUser = await usersCollection.findOne({ email });
    res.json({
      success: true,
      trips: updatedUser.trips,
      totalDistance,
      rating,
      badges: updatedUser.badges,
    });
  } catch (err) {
    console.error("❌ Error adding trip:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get All Users (fast + limited)
app.get("/api/get-all-users", async (req, res) => {
  try {
    const users = await usersCollection
      .find({}, { projection: { firstName: 1, lastName: 1, email: 1, college: 1, img: 1, trips: { $slice: 1 } } })
      .limit(10)
      .toArray();

    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

// ✅ Find Users by Trip
app.post("/api/find-users-by-trip", async (req, res) => {
  const { date, destination } = req.body;
  if (!date || !destination)
    return res.json({ success: false, message: "Missing date or destination" });

  try {
    const users = await usersCollection
      .find({
        trips: {
          $elemMatch: {
            date,
            destination: { $regex: new RegExp(`^${destination}$`, "i") },
          },
        },
      })
      .project({ firstName: 1, lastName: 1, email: 1, college: 1, img: 1, trips: 1 })
      .toArray();

    res.json({ success: true, users });
  } catch (err) {
    console.error("❌ Find-users-by-trip error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Serve frontend pages
const pages = ["index", "find-companion", "explore-trips", "profile", "signin", "signup"];
pages.forEach((page) =>
  app.get(`/${page === "index" ? "" : page}`, (req, res) =>
    res.sendFile(path.join(__dirname, "public", `${page}.html`))
  )
);

// ✅ Default route
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
