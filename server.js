import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const usersFile = path.join(__dirname, "users.json");

// ----------------- Ensure users.json exists -----------------
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
    console.log("✅ Created users.json");
}

// ----------------- Helper Functions -----------------
function loadUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        }
        return [];
    } catch (err) {
        console.error("❌ Error reading users.json:", err);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log("✅ Saved users.json at", usersFile);
    } catch (err) {
        console.error("❌ Error writing users.json:", err);
    }
}

// ----------------- Signup API -----------------
app.post("/api/signup", (req, res) => {
    const data = req.body;
    if (!data.firstName || !data.email || !data.password) {
        return res.json({ success: false, message: "Missing fields" });
    }

    let users = loadUsers();

    if (users.find(u => u.email === data.email)) {
        return res.json({ success: false, message: "Email already exists" });
    }

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
        bio: data.bio || ""
    };

    users.push(newUser);

    try {
        saveUsers(users);
        console.log("👤 New user registered:", newUser.email);
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error("❌ Error saving new user:", err);
        res.json({ success: false, message: "Failed to save user" });
    }
});

// ----------------- Login API -----------------
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Missing fields" });

    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.json({ success: false, message: "Invalid email or password" });

    res.json({ success: true, user });
});

// ----------------- Update Profile API -----------------
app.post("/api/update-profile", (req, res) => {
    const {
        email,
        firstName,
        lastName,
        phone,
        age,
        travelStyle,
        college,
        bio,
        aadhaar,
        newsletter,
        trips,
        blogs,
        badges,
        totalDistance,
        rating
    } = req.body;

    if (!email) return res.json({ success: false, message: "Missing email" });

    let users = loadUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return res.json({ success: false, message: "User not found" });

    const user = users[idx];

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (travelStyle !== undefined) user.travelStyle = travelStyle;
    if (college !== undefined) user.college = college;
    if (bio !== undefined) user.bio = bio;
    if (aadhaar !== undefined) user.aadhaar = aadhaar;
    if (newsletter !== undefined) user.newsletter = newsletter;
    if (trips !== undefined) user.trips = trips;
    if (blogs !== undefined) user.blogs = blogs;
    if (badges !== undefined) user.badges = badges;
    if (totalDistance !== undefined) user.totalDistance = totalDistance;
    if (rating !== undefined) user.rating = rating;

    saveUsers(users);
    console.log("✏️ Profile updated:", email);

    res.json({ success: true, user });
});

// ----------------- Add Blog API -----------------
app.post("/api/add-blog", (req, res) => {
    const { email, blog } = req.body;
    if (!email || !blog || !blog.title || !blog.content) {
        return res.json({ success: false, message: "Missing fields" });
    }

    let users = loadUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return res.json({ success: false, message: "User not found" });

    if (!users[idx].blogs) users[idx].blogs = [];
    users[idx].blogs.push({ ...blog, date: new Date().toLocaleString() });

    saveUsers(users);
    console.log("📝 Blog added by:", email);

    res.json({ success: true, blogs: users[idx].blogs });
});

// ----------------- Fetch User Blogs -----------------
app.get("/api/blogs/:email", (req, res) => {
    const email = req.params.email;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, blogs: user.blogs || [] });
});

// ----------------- Add Trip API -----------------
app.post("/api/add-trip", (req, res) => {
    const { email, college, startDate, endDate, destination } = req.body;
    if (!email || !startDate || !endDate || !destination) {
        return res.json({ success: false, message: "Missing fields" });
    }

    let users = loadUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return res.json({ success: false, message: "User not found" });

    if (!users[idx].trips) users[idx].trips = [];

    const newTrip = {
        college: college || users[idx].college || "",
        destination,
        startDate,
        endDate,
        createdAt: new Date().toLocaleString()
    };

    users[idx].trips.push(newTrip);

    saveUsers(users);
    console.log("🚌 Trip added for:", email);

    res.json({ success: true, trips: users[idx].trips });
});

// ----------------- Fetch User Trips -----------------
app.get("/api/trips/:email", (req, res) => {
    const email = req.params.email;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({ success: true, trips: user.trips || [] });
});

// ----------------- Companions API -----------------
app.get("/api/companions", (req, res) => {
    const { college, startDate, endDate, destination, email } = req.query;
    const users = loadUsers();

    const companions = users.filter(u => {
        if (u.email === email || !u.trips) return false;

        return u.trips.some(t => {
            const matchesDest = t.destination.toLowerCase() === destination.toLowerCase();
            const matchesCollege = college ? (u.college || "").toLowerCase() === college.toLowerCase() : true;

            // date range overlap logic
            const tripStart = new Date(t.startDate);
            const tripEnd = new Date(t.endDate);
            const reqStart = new Date(startDate);
            const reqEnd = new Date(endDate);

            const matchesDate = tripStart <= reqEnd && tripEnd >= reqStart;

            return matchesDest && matchesCollege && matchesDate;
        });
    });

    res.json({ success: true, companions });
});


// ----------------- Serve HTML Pages -----------------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/find-companion", (req, res) => res.sendFile(path.join(__dirname, "public", "find-companion.html")));
app.get("/explore-trips", (req, res) => res.sendFile(path.join(__dirname, "public", "explore-trips.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "public", "profile.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "public", "about.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "public", "contact.html")));
app.get("/blog", (req, res) => res.sendFile(path.join(__dirname, "public", "blog.html")));
app.get("/signin", (req, res) => res.sendFile(path.join(__dirname, "public", "signin.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public", "signup.html")));

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
