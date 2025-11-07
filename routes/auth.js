const signupForm = document.getElementById("signupForm");

const baseURL = window.location.hostname === "localhost"
  ? "http://localhost:5001"
  : "https://travelbuddy-hluu.onrender.com";

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const college = document.getElementById("college").value.trim();
  const age = document.getElementById("age").value;
  const travelStyle = document.getElementById("travelStyle").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const aadhaar = document.getElementById("aadhaar").value.trim();
  const photoFile = document.getElementById("profilePhoto").files[0];

  if (password !== confirmPassword) return alert("Passwords do not match!");

  if (!photoFile) return alert("Please select a profile photo!");

  const reader = new FileReader();
  reader.onloadend = async () => {
    const imgBase64 = reader.result;

    const userData = {
      firstName,
      lastName,
      email,
      phone,
      college,
      age,
      travelStyle,
      password,
      aadhaar,
      img: imgBase64,
    };

    try {
      const res = await fetch(`${baseURL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Signup successful! Redirecting to profile...");
        window.location.href = "profile.html";
      } else {
        alert(data.message || "Signup failed, try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Error connecting to server.");
    }
  };

  reader.readAsDataURL(photoFile);
});
