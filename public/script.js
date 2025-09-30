// TravelBunk - Interactive JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Authentication State Management
    checkAuthState();
    
    // Expose global helpers to attach JWT automatically to API requests after login
    window.attachJWTToRequests = function(token) {
        // Attach JWT to API requests (guard if axios is not present)
        if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    };
    
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth Scrolling for Navigation Links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            }
        });
    });
    
    // Budget Slider Functionality
    const budgetSlider = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');
    
    if (budgetSlider && budgetValue) {
        // Initialize display on load
        const initVal = parseInt(budgetSlider.value);
        budgetValue.textContent = initVal.toLocaleString();
        updateDestinations(initVal);

        budgetSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            budgetValue.textContent = value.toLocaleString();
            
            // Update destinations based on budget (mock functionality)
            updateDestinations(value);
        });
    }
    
    // Update destinations based on budget
    function updateDestinations(budget) {
        const destinationCards = document.querySelectorAll('.destination-card');
        
        destinationCards.forEach(card => {
            const priceText = card.querySelector('.price').textContent;
            const priceRange = priceText.match(/₹([\d,]+)\s*-\s*₹([\d,]+)/);
            
            if (priceRange) {
                const minPrice = parseInt(priceRange[1].replace(',', ''));
                const maxPrice = parseInt(priceRange[2].replace(',', ''));
                
                if (budget >= minPrice && budget <= maxPrice + 1000) {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                } else {
                    card.style.opacity = '0.5';
                    card.style.transform = 'scale(0.95)';
                }
            }
        });
    }
    
    // Floating Animation for Hero Icons
    function animateFloatingIcons() {
        const icons = document.querySelectorAll('.floating-icons i');
        
        icons.forEach((icon, index) => {
            const delay = index * 1500;
            const duration = 6000 + (index * 500);
            
            setInterval(() => {
                icon.style.transform = `translateY(-20px) rotate(${Math.random() * 10 - 5}deg)`;
                
                setTimeout(() => {
                    icon.style.transform = `translateY(0px) rotate(0deg)`;
                }, duration / 2);
            }, duration);
        });
    }
    
    // Initialize floating icons animation
    animateFloatingIcons();
    
    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.step-card, .companion-card, .room-card, .destination-card, .testimonial-card, .safety-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Connect Button Functionality
    const connectButtons = document.querySelectorAll('.btn-outline');
    connectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const originalText = this.textContent;
            this.textContent = 'Connecting...';
            this.style.background = '#00BFA6';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.textContent = 'Connected! 🎉';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = 'transparent';
                    this.style.color = '#00BFA6';
                }, 2000);
            }, 1500);
        });
    });
    
    // (Removed mock Join Room button handler; real API-based handler added above)
    
    // Chat Icon Functionality
    const chatIcon = document.querySelector('.chat-icon');
    if (chatIcon) {
        chatIcon.addEventListener('click', function() {
            // Mock chat functionality
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.style.background = '#4CAF50';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-comments"></i>';
                this.style.background = 'linear-gradient(135deg, #00BFA6, #FDCB6E)';
            }, 2000);
            
            // Show mock notification
            showNotification('Chat feature coming soon! 💬');
        });
    }
    
    // Notification System (use global function declared below)
    
    // Navbar Scroll Effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        // Add background when scrolled
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 191, 166, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 191, 166, 0.1)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Testimonial Cards Hover Effect
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const stats = this.querySelector('.social-stats');
            if (stats) {
                const hearts = stats.querySelector('span:first-child');
                const comments = stats.querySelector('span:last-child');
                
                if (hearts && comments) {
                    const heartCount = parseInt(hearts.textContent.match(/\d+/)[0]);
                    const commentCount = parseInt(comments.textContent.match(/\d+/)[0]);
                    
                    hearts.innerHTML = `<i class="fas fa-heart"></i> ${heartCount + Math.floor(Math.random() * 5) + 1}`;
                    comments.innerHTML = `<i class="fas fa-comment"></i> ${commentCount + Math.floor(Math.random() * 3) + 1}`;
                }
            }
        });
    });
    
    // Safety Features Hover Effects
    const safetyCards = document.querySelectorAll('.safety-card');
    safetyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.safety-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.safety-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
    
    // Store Badge Hover Effects
    const storeBadges = document.querySelectorAll('.store-badge');
    storeBadges.forEach(badge => {
        badge.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('App launching soon! Stay tuned 📱');
        });
    });
    
    // Add some Gen Z confessions/memes (Easter eggs)
    const easterEggs = [
        "Bunked my class and went to Ladakh 🤐",
        "Found my travel soulmate on TravelBunk 💕",
        "Budget: ₹3000, Memories: Priceless 🎒",
        "Solo trip turned into squad goals 👥",
        "WiFi > Everything (except travel) 📶"
    ];
    
    // Random easter egg on logo click
    const logo = document.querySelector('.nav-logo h2');
    if (logo) {
        let clickCount = 0;
        logo.addEventListener('click', function() {
            clickCount++;
            if (clickCount >= 3) {
                const randomEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)];
                showNotification(randomEgg);
                clickCount = 0;
            }
        });
    }
    
    // Initialize all animations and effects
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
    
    // --- Dynamic Trips Listing & Join/Leave Wiring ---
    const roomsGrid = document.querySelector('.trip-rooms .rooms-grid');
    function getAuthToken() {
        try { return localStorage.getItem('authToken'); } catch (_) { return null; }
    }
    function createRoomCard(trip) {
        const badge = trip.budget && trip.budget.max <= 10000 ? 'budget' : 'adventure';
        const members = (trip.participants?.length || 1);
        const dates = (trip.startDate && trip.endDate)
            ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`
            : 'Flexible';
        const joined = (trip._joined === true);

        const btnText = joined ? 'Joined' : 'Join Room';
        const btnClass = joined ? 'btn btn-success joined' : 'btn btn-primary join-room-btn';

        return `
            <div class="room-card" data-trip-id="${trip._id}">
                <div class="room-image">
                    <img src="${trip.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop'}" alt="${trip.destination}">
                    <div class="room-badges">
                        <span class="badge ${badge}">${badge === 'budget' ? 'Budget Friendly' : 'Adventure'}</span>
                    </div>
                </div>
                <div class="room-content">
                    <h3>${trip.title || trip.destination}</h3>
                    <p><i class="fas fa-users"></i> ${members} members • <i class="fas fa-calendar"></i> ${dates}</p>
                    <p class="room-description">${trip.description || 'Join fellow travelers for an awesome experience!'}</p>
                    <button class="${btnClass}">${btnText}</button>
                </div>
            </div>
        `;
    }
    
    // Loading skeletons for trips list
    function renderLoadingSkeleton() {
        if (!roomsGrid) return;
        const skeletonCard = () => `
            <div class="room-card loading">
                <div class="room-image" style="background:#eee; height:250px; border-radius:12px"></div>
                <div class="room-content">
                    <div style="height:18px;background:#eee;border-radius:6px;width:60%;margin:8px 0"></div>
                    <div style="height:14px;background:#f0f0f0;border-radius:6px;width:80%;margin:8px 0"></div>
                    <div style="height:38px;background:#eaeaea;border-radius:8px;width:120px;margin-top:12px"></div>
                </div>
            </div>`;
        roomsGrid.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();
    }
    
    async function fetchTrips() {
        try {
            renderLoadingSkeleton();
            const res = await fetch('/api/trips');
            if (!res.ok) throw new Error('Failed to load trips');
            const data = await res.json();
            const trips = Array.isArray(data) ? data : (data.trips || []);
            const userId = (JSON.parse(localStorage.getItem('userData') || '{}')._id) || null;

            // mark joined if user is in participants
            trips.forEach(t => {
                const participants = t.participants || [];
                t._joined = !!participants.find(p => (p.userId || p._id || p.id) === userId);
            });

            if (roomsGrid) {
                roomsGrid.innerHTML = trips.map(createRoomCard).join('');
                attachJoinHandlers();
                attachLeaveHandlers();
            }
        } catch (error) {
            console.error(error);
            if (roomsGrid) {
                roomsGrid.innerHTML = '<p style="padding:16px">Unable to load trips right now.</p>';
            }
        }
    }

    function attachJoinHandlers() {
        document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.currentTarget.closest('.room-card');
                const tripId = card?.getAttribute('data-trip-id');
                if (!tripId) return;

                const token = getAuthToken();
                if (!token) {
                    alert('Please sign in to join a room.');
                    return;
                }

                const user = JSON.parse(localStorage.getItem('userData') || '{}');
                const body = {
                    userId: user._id || user.id,
                    userName: user.name || user.displayName || 'Traveler',
                    userProfilePicture: user.profilePicture || user.photoURL || ''
                };

                const original = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
                try {
                    const res = await fetch(`/api/trips/${tripId}/join`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Failed to join');
                    }
                    btn.classList.remove('btn-primary', 'join-room-btn');
                    btn.classList.add('btn-success', 'joined');
                    btn.textContent = 'Joined';
                    btn.disabled = false;
                    attachLeaveHandlers();
                } catch (error) {
                    console.error('Join failed:', error);
                    alert(error.message || 'Failed to join room');
                    btn.disabled = false;
                    btn.innerHTML = original;
                }
            });
        });
    }

    function attachLeaveHandlers() {
        document.querySelectorAll('.room-card .joined').forEach(btn => {
            if (btn.dataset.leaveBound === '1') return;
            btn.dataset.leaveBound = '1';
            btn.addEventListener('click', async (e) => {
                const card = e.currentTarget.closest('.room-card');
                const tripId = card?.getAttribute('data-trip-id');
                if (!tripId) return;

                const token = getAuthToken();
                if (!token) {
                    alert('Please sign in to manage your rooms.');
                    return;
                }

                const user = JSON.parse(localStorage.getItem('userData') || '{}');
                const body = { userId: user._id || user.id };

                const original = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Leaving...';
                try {
                    const res = await fetch(`/api/trips/${tripId}/leave`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Failed to leave');
                    }
                
    btn.classList.remove('btn-success', 'joined');
                    btn.classList.add('btn-primary', 'join-room-btn');
                    btn.textContent = 'Join Room';
                    btn.disabled = false;
                    btn.dataset.leaveBound = '0';
                    attachJoinHandlers();
                } catch (error) {
                    console.error('Leave failed:', error);
                    alert(error.message || 'Failed to leave room');
                    btn.disabled = false;
                    btn.innerHTML = original;
                }
            });
        });
    }
    
    if (roomsGrid) {
        fetchTrips();
    }
});

// Auth helpers for API calls
window.getAuthToken = function() {
    try {
        return localStorage.getItem('authToken');
    } catch (_) {
        return null;
    }
};

window.getAuthHeaders = function(extra = {}) {
    const token = window.getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// apiFetch automatically attaches Authorization header if available
window.apiFetch = function(url, options = {}) {
    const token = window.getAuthToken();
    const merged = {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
    return fetch(url, merged);
};

// Authentication State Management
function checkAuthState() {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    const navCta = document.querySelector('.nav-cta');
    
    if (authToken && userData) {
        // User is authenticated - update navigation
        const user = JSON.parse(userData);
        if (navCta) {
            const firstName = (user && typeof user.name === 'string' && user.name.trim())
                ? user.name.split(' ')[0]
                : (user && typeof user.email === 'string' && user.email.includes('@')
                    ? user.email.split('@')[0]
                    : 'Traveler');
            navCta.innerHTML = `
                <div class="user-menu">
                    <span class="welcome-text">Hi, ${firstName}!</span>
                    <button class="logout-btn" onclick="handleLogout()">Logout</button>
                </div>
            `;
        }
    } else {
        // User is not authenticated - show login/signup buttons
        if (navCta) {
            navCta.innerHTML = `
                <a href="signin.html" class="login-btn">Login</a>
                <a href="signup.html" class="signup-btn">Sign Up</a>
            `;
        }
    }
}

// Handle logout
function handleLogout() {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Sign out from Firebase if available
    if (window.firebaseAuth && window.firebaseAuth.signOut) {
        window.firebaseAuth.signOut();
    }
    
    // Redirect to home page
    window.location.href = '/';
    
    // Show notification
    setTimeout(() => {
        showNotification('You have been logged out successfully!');
    }, 500);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .navbar {
        transition: all 0.3s ease;
    }
    
    .safety-icon {
        transition: all 0.3s ease;
    }
    
    .loaded .hero-visual {
        animation: fadeInRight 1s ease-out;
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(50px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            left: -100%;
            top: 70px;
            flex-direction: column;
            background-color: white;
            width: 100%;
            text-align: center;
            transition: 0.3s;
            box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
            padding: 2rem 0;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: translateY(8px) rotate(45deg);
        }
        
        .hamburger.active span:nth-child(3) {
            transform: translateY(-8px) rotate(-45deg);
        }
    }
`;
document.head.appendChild(style);

