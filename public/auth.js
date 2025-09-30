const signupForm = document.getElementById('signupForm');

// Aadhaar validation list
const validAadhaars = ["123456789012","987654321098"];
const aadhaarInput = document.getElementById('aadhaar');
const aadhaarMsg = document.getElementById('aadhaarMessage');

aadhaarInput.addEventListener('input', function() {
    const val = aadhaarInput.value.trim();
    if (val.length === 12) {
        if (validAadhaars.includes(val)) {
            aadhaarMsg.innerText = 'Valid Aadhaar ✅';
            aadhaarMsg.style.color = 'green';
        } else {
            aadhaarMsg.innerText = 'Invalid Aadhaar ❌';
            aadhaarMsg.style.color = 'red';
        }
    } else {
        aadhaarMsg.innerText = '';
    }
});

// Signup submit
signupForm.addEventListener('submit', async function(e){
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(signupForm));

    if(formData.password !== formData.confirmPassword){
        alert('Passwords do not match'); 
        return;
    }

    if(!validAadhaars.includes(formData.aadhaar)){
        alert('Invalid Aadhaar'); 
        return;
    }

    try{
        const res = await fetch('/api/signup', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if(data.success){
            alert('Account created successfully!');
            window.location.href = '/signin.html';
        } else {
            alert(data.message || 'Server error. Try again.');
        }
    } catch(err){
        console.error(err);
        alert('Server error. Try again.');
    }
});
