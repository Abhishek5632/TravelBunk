import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// ✅ Allow large JSON payloads (for Base64 profile images)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Serve static frontend files
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


// ----------------- SIGNUP API -----------------
// ----------------- SIGNUP API (with Aadhaar Validation) -----------------
app.post("/api/signup", async (req, res) => {
  try {
    const data = req.body;

    // ✅ Required field checks
    if (!data.firstName || !data.email || !data.password) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // ✅ Aadhaar Validation (12 digits + Verhoeff checksum)
    if (!/^\d{12}$/.test(data.aadhaar)) {
      return res.json({ success: false, message: "Invalid Aadhaar number format" });
    }
    if (!verhoeffCheck(data.aadhaar)) {
      return res.json({ success: false, message: "Invalid Aadhaar checksum" });
    }

    // ✅ Check if user already exists
    const existingUser = await usersCollection.findOne({ email: data.email });
    if (existingUser)
      return res.json({ success: false, message: "Email already exists" });

    // ✅ Create new user
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


// ----------------- Aadhaar Verhoeff Algorithm (Server-side Validation) -----------------
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


// ----------------- LOGIN API -----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Missing fields" });

  const user = await usersCollection.findOne({ email, password });
  if (!user)
    return res.json({ success: false, message: "Invalid email or password" });

  res.json({ success: true, user });
});

// ----------------- UPDATE PROFILE API -----------------
app.post("/api/update-profile", async (req, res) => {
  try {
    const { email, ...updates } = req.body;
    if (!email)
      return res.json({ success: false, message: "Missing email" });

    // ✅ Remove _id field if sent accidentally
    if (updates._id) delete updates._id;

    const result = await usersCollection.updateOne({ email }, { $set: updates });

    if (result.modifiedCount === 0)
      return res.json({ success: false, message: "No changes or user not found" });

    const updatedUser = await usersCollection.findOne({ email });
    console.log("✏️ Profile updated:", email);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------- ADD BLOG API -----------------
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

// ----------------- FETCH USER BLOGS -----------------
app.get("/api/blogs/:email", async (req, res) => {
  const email = req.params.email;
  const user = await usersCollection.findOne({ email });
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, blogs: user.blogs || [] });
});

// ----------------- ADD TRIP API (auto updates distance, badges, rating) -----------------
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
    // 🚌 Add the trip
    await usersCollection.updateOne({ email }, { $push: { trips: newTrip } });

    // Fetch updated trips
    const user = await usersCollection.findOne({ email });
    const totalDistance = (user.trips || []).reduce(
      (sum, t) => sum + (parseFloat(t.distance) || 0),
      0
    );

    // 🏅 Determine new badges and rating dynamically
    const tripCount = user.trips.length;
    let badges = ["🎒 New Explorer", "🧭 Joined TravelBuddy"];
    let rating = parseFloat(user.rating) || 4.0;

    if (tripCount >= 3) badges.push("🚗 Frequent Traveler");
    if (tripCount >= 5) badges.push("🌍 Globetrotter");
    if (totalDistance > 2000) badges.push("🏆 Long Journey Expert");

    // Increase rating a bit after every few trips (demo logic)
    rating = Math.min(5, (4 + tripCount * 0.1).toFixed(1));

    // Update user data
    await usersCollection.updateOne(
      { email },
      { $set: { totalDistance, badges, rating } }
    );

    const updatedUser = await usersCollection.findOne({ email });

    console.log(`🚌 Trip added for ${email} | Distance: ${totalDistance} km | Rating: ${rating}`);
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


// ----------------- FETCH USER TRIPS -----------------
app.get("/api/user-trips/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await usersCollection.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, trips: user.trips || [] });
  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------- ✅ GET ALL USERS (Used by Find Companion) -----------------
app.get("/api/get-all-users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.json({ success: false, message: "Error fetching users" });
  }
});
app.get("/api/user-profile", async (req, res) => {
  try {
    const email = req.query.email;
    const user = await usersCollection.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ----------------- ✅ FIND USERS BY TRIP -----------------
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
      .toArray();

    // ✅ Add default image if missing
    const matchedUsers = users.map((u) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      age: u.age,
      travelStyle: u.travelStyle,
      college: u.college || "",
      img:
        u.img ||
        "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
      trips: u.trips.filter(
        (t) =>
          t.date === date &&
          t.destination.toLowerCase() === destination.toLowerCase()
      ),
    }));

    console.log("🔎 Found:", matchedUsers.length, "users for trip search");
    res.json({ success: true, users: matchedUsers });
  } catch (err) {
    console.error("❌ Find-users-by-trip error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------- GET USER BY EMAIL -----------------
app.get("/api/get-user-by-email", async (req, res) => {
  const { email } = req.query;
  try {
    const user = await usersCollection.findOne({ email });
    if (user) res.json({ success: true, user });
    else res.json({ success: false, message: "User not found" });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.json({ success: false, message: "Server error" });
  }
});

// ----------------- GOOGLE SITE VERIFICATION -----------------
app.get("/google376b52ea58ffbfb3.html", (req, res) => {
  res.type("text/plain");
  res.send("google-site-verification: google376b52ea58ffbfb3.html");
});

// ----------------- SERVE FRONTEND PAGES -----------------
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
  "trips",
];

pages.forEach((page) =>
  app.get(`/${page === "index" ? "" : page}`, (req, res) =>
    res.sendFile(path.join(__dirname, "public", `${page}.html`))
  )
);

// ----------------- DEFAULT HOME -----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------- START SERVER -----------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
