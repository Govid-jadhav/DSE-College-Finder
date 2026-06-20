// Shared Authentication & Session Manager with Flyout Mobile Drawer Support

window.token = localStorage.getItem('dse_auth_token') || null;
window.currentUser = null;
window.shortlistedColleges = [];

// DOM elements reference helper
const getEl = (id) => document.getElementById(id);

// Check user session via JWT profile API
window.checkUserSession = async function() {
    if (!window.token) {
        updateHeaderUI();
        updateDrawerUI();
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        
        if (response.ok) {
            window.currentUser = await response.json();
            
            // Sync user shortlist from cloud if present
            if (window.currentUser.shortlist && window.currentUser.shortlist.length > 0) {
                window.shortlistedColleges = window.currentUser.shortlist.map(code => ({ choice_code: code }));
                saveShortlistToLocalStorage();
            }
            updateHeaderUI();
            updateDrawerUI();
            
            // Trigger customized session callback on individual pages if defined
            if (typeof window.onAuthInitialized === 'function') {
                window.onAuthInitialized(window.currentUser);
            }
        } else {
            // Token is invalid or expired
            window.handleSignout();
        }
    } catch (err) {
        console.error('Session check error:', err);
        updateHeaderUI();
        updateDrawerUI();
    }
};

// Global Signout Handler
window.handleSignout = function() {
    window.token = null;
    window.currentUser = null;
    localStorage.removeItem('dse_auth_token');
    localStorage.removeItem('dse_shortlisted_codes');
    window.shortlistedColleges = [];
    
    updateHeaderUI();
    updateDrawerUI();
    
    // Custom callback or page redirect on signout
    if (typeof window.onAuthSignout === 'function') {
        window.onAuthSignout();
    } else {
        // Default signout action: redirect to main home page
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/';
        } else {
            window.location.reload();
        }
    }
};

// Update header interface based on session state (Desktop)
function updateHeaderUI() {
    const signinBtn = getEl('header-signin-btn');
    const dropdownMenu = getEl('header-profile-dropdown');
    const avatar = getEl('user-avatar');
    const display = getEl('user-display');
    const syncStatus = getEl('sync-shortlist-status');
    const badge = getEl('shortlist-badge');

    if (badge) {
        badge.textContent = window.shortlistedColleges.length;
    }

    if (signinBtn && dropdownMenu) {
        if (window.token && window.currentUser) {
            signinBtn.classList.add('hidden');
            dropdownMenu.classList.remove('hidden');
            
            const initials = window.currentUser.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            if (avatar) avatar.textContent = initials || 'U';
            if (display) display.textContent = window.currentUser.username.split(' ')[0];
            
            if (syncStatus) {
                syncStatus.innerHTML = `
                    <i data-lucide="cloud-check" style="color: var(--match-color); width: 14px; height: 14px;"></i>
                    <span>Cloud Synced</span>
                `;
            }
            
            // Admin Panel link check
            const dropdownList = document.querySelector('.dropdown-menu-list');
            const existingAdminLink = getEl('admin-dashboard-link');
            if (existingAdminLink) existingAdminLink.remove();
            
            if (window.currentUser.role === 'admin' && dropdownList) {
                const adminLi = document.createElement('li');
                adminLi.id = 'admin-dashboard-link';
                adminLi.innerHTML = `
                    <a href="/admin" class="dropdown-item" style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem; width: 100%; border-top: 1px solid var(--card-border); margin-top: 0.25rem; padding-top: 0.5rem;">
                        <i data-lucide="shield"></i>
                        <span>Admin Panel</span>
                    </a>
                `;
                dropdownList.insertBefore(adminLi, dropdownList.lastElementChild);
            }
        } else {
            signinBtn.classList.remove('hidden');
            dropdownMenu.classList.add('hidden');
            
            if (syncStatus) {
                syncStatus.innerHTML = `
                    <i data-lucide="cloud-lightning" style="color: var(--text-muted); width: 14px; height: 14px;"></i>
                    <span>Guest Session</span>
                `;
            }
        }
        lucide.createIcons();
    }
}

// Update mobile drawer UI status
function updateDrawerUI() {
    const footerContainer = getEl('mobile-drawer-user-footer');
    if (!footerContainer) return;
    
    if (window.token && window.currentUser) {
        const initials = window.currentUser.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        let adminOptionHTML = '';
        if (window.currentUser.role === 'admin') {
            adminOptionHTML = `
                <a href="/admin" class="mobile-drawer-item" style="border-top: 1px solid var(--card-border); margin-top: 0.25rem; padding-top: 0.75rem;">
                    <i data-lucide="shield"></i>
                    <span>Admin Panel</span>
                </a>
            `;
        }
        
        footerContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <div class="user-avatar-initials" style="width: 38px; height: 38px; font-size: 0.85rem;">${initials}</div>
                <div style="text-align: left;">
                    <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">${window.currentUser.username}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
                        <i data-lucide="cloud-check" style="color: var(--match-color); width: 12px; height: 12px;"></i>
                        <span>Cloud Synced</span>
                    </div>
                </div>
            </div>
            ${adminOptionHTML}
            <button id="drawer-signout-btn" class="btn btn-secondary btn-full-width">
                <i data-lucide="log-out"></i>
                <span>Sign Out</span>
            </button>
        `;
        
        const signoutBtn = getEl('drawer-signout-btn');
        if (signoutBtn) signoutBtn.addEventListener('click', window.handleSignout);
    } else {
        footerContainer.innerHTML = `
            <button id="drawer-signin-btn" class="btn btn-primary btn-full-width">
                <i data-lucide="user"></i>
                <span>Sign In</span>
            </button>
        `;
        
        const signinBtn = getEl('drawer-signin-btn');
        if (signinBtn) {
            signinBtn.addEventListener('click', () => {
                window.hideMobileDrawer();
                window.showAuthModal('login');
            });
        }
    }
    lucide.createIcons();
}

// Local Storage helpers for guest shortlist backup
function saveShortlistToLocalStorage() {
    const codes = window.shortlistedColleges.map(c => c ? c.choice_code : null).filter(Boolean);
    localStorage.setItem('dse_shortlisted_codes', JSON.stringify(codes));
}

window.loadShortlistFromLocalStorage = function() {
    const stored = localStorage.getItem('dse_shortlisted_codes');
    if (stored) {
        try {
            const codes = JSON.parse(stored);
            window.shortlistedColleges = codes.map(code => ({ choice_code: code, college_name: 'Loading...', branch_name: '' }));
            if (getEl('shortlist-badge')) {
                getEl('shortlist-badge').textContent = window.shortlistedColleges.length;
            }
        } catch (e) {
            console.error("Error reading shortlist from localStorage:", e);
            window.shortlistedColleges = [];
        }
    }
};

// Sync shortlist with database
window.syncShortlistWithCloud = async function() {
    if (!window.token) return;
    
    const codes = window.shortlistedColleges.map(c => c ? c.choice_code : null).filter(Boolean);
    
    try {
        const response = await fetch('/api/user/shortlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.token}`
            },
            body: JSON.stringify({ shortlist: codes })
        });
        
        if (response.ok) {
            console.log('Shortlist cloud sync completed.');
        } else {
            console.warn('Could not sync shortlist with cloud database.');
        }
    } catch (err) {
        console.error('Shortlist cloud sync network error:', err);
    }
};

// Dynamic Authentication Modal injection & management
window.showAuthModal = function(tab = 'login') {
    let authModal = getEl('auth-modal');
    if (!authModal) {
        injectAuthModalHTML();
        authModal = getEl('auth-modal');
    }
    
    authModal.classList.remove('hidden');
    window.switchAuthTab(tab);
};

window.hideAuthModal = function() {
    const authModal = getEl('auth-modal');
    if (!authModal) return;
    
    authModal.classList.add('hidden');
    getEl('login-error-msg').classList.add('hidden');
    getEl('signup-error-msg').classList.add('hidden');
    getEl('forgot-error-msg').classList.add('hidden');
    getEl('reset-error-msg').classList.add('hidden');
    getEl('login-form').reset();
    getEl('signup-form').reset();
    getEl('forgot-password-form').reset();
    getEl('reset-password-form').reset();
    showLoginScreen();
};

window.switchAuthTab = function(tab) {
    if (getEl('forgot-password-form')) getEl('forgot-password-form').classList.add('hidden');
    if (getEl('reset-password-form')) getEl('reset-password-form').classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'flex';
    
    if (tab === 'login') {
        getEl('login-tab-btn').classList.add('active');
        getEl('signup-tab-btn').classList.remove('active');
        getEl('login-form').classList.remove('hidden');
        getEl('signup-form').classList.add('hidden');
    } else {
        getEl('signup-tab-btn').classList.add('active');
        getEl('login-tab-btn').classList.remove('active');
        getEl('signup-form').classList.remove('hidden');
        getEl('login-form').classList.add('hidden');
    }
};

function showForgotScreen() {
    getEl('login-form').classList.add('hidden');
    getEl('signup-form').classList.add('hidden');
    getEl('forgot-password-form').classList.remove('hidden');
    getEl('reset-password-form').classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'none';
    getEl('forgot-password-form').reset();
}

function showResetScreen() {
    getEl('login-form').classList.add('hidden');
    getEl('signup-form').classList.add('hidden');
    getEl('forgot-password-form').classList.add('hidden');
    getEl('reset-password-form').classList.remove('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'none';
    getEl('reset-password-form').reset();
}

function showLoginScreen() {
    getEl('login-form').classList.remove('hidden');
    getEl('signup-form').classList.add('hidden');
    getEl('forgot-password-form').classList.add('hidden');
    getEl('reset-password-form').classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'flex';
    window.switchAuthTab('login');
}

// Inject Authentication Modal into Document Body
function injectAuthModalHTML() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'auth-modal';
    modalDiv.className = 'auth-modal-overlay hidden';
    modalDiv.innerHTML = `
        <div class="auth-modal-card Card">
            <button id="close-auth-modal-btn" class="auth-modal-close icon-btn" aria-label="Close dialog">
                <i data-lucide="x"></i>
            </button>
            
            <div class="auth-tabs">
                <button id="login-tab-btn" class="auth-tab active">Sign In</button>
                <button id="signup-tab-btn" class="auth-tab">Sign Up</button>
            </div>
            
            <!-- Login Form -->
            <form id="login-form" class="auth-form">
                <div class="form-group">
                    <label for="login-email">Email Address</label>
                    <div class="input-wrapper">
                        <i data-lucide="mail" class="field-icon"></i>
                        <input type="email" id="login-email" required placeholder="name@example.com">
                    </div>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <div class="input-wrapper">
                        <i data-lucide="lock" class="field-icon"></i>
                        <input type="password" id="login-password" required placeholder="Enter password">
                    </div>
                </div>
                <div id="login-error-msg" class="auth-error-msg hidden"></div>
                <button type="submit" class="btn btn-primary btn-full">
                    <span>Sign In</span>
                    <i data-lucide="arrow-right"></i>
                </button>
                <button type="button" id="forgot-password-btn" class="btn btn-secondary btn-full" style="margin-top: 0.5rem;">
                    <i data-lucide="help-circle"></i>
                    <span>Forgot Password?</span>
                </button>
            </form>
            
            <!-- Signup Form -->
            <form id="signup-form" class="auth-form hidden">
                <div class="form-group">
                    <label for="signup-username">Full Name</label>
                    <div class="input-wrapper">
                        <i data-lucide="user" class="field-icon"></i>
                        <input type="text" id="signup-username" required placeholder="e.g. Govinda Jadhav">
                    </div>
                </div>
                <div class="form-group">
                    <label for="signup-email">Email Address</label>
                    <div class="input-wrapper">
                        <i data-lucide="mail" class="field-icon"></i>
                        <input type="email" id="signup-email" required placeholder="name@example.com">
                    </div>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password</label>
                    <div class="input-wrapper">
                        <i data-lucide="lock" class="field-icon"></i>
                        <input type="password" id="signup-password" required placeholder="Minimum 6 characters">
                    </div>
                </div>
                <div class="form-group">
                    <label for="signup-confirm-password">Confirm Password</label>
                    <div class="input-wrapper">
                        <i data-lucide="lock" class="field-icon"></i>
                        <input type="password" id="signup-confirm-password" required placeholder="Verify password">
                    </div>
                </div>
                <div class="form-group">
                    <label for="signup-admin-code">Admin Access Code (Optional)</label>
                    <div class="input-wrapper">
                        <i data-lucide="shield-alert" class="field-icon"></i>
                        <input type="text" id="signup-admin-code" placeholder="Enter secret code for admin role">
                    </div>
                    <span class="helper-text" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">Only required during signup to register as an administrator. Standard login does not require a secret key.</span>
                </div>
                <div id="signup-error-msg" class="auth-error-msg hidden"></div>
                <button type="submit" class="btn btn-primary btn-full">
                    <span>Create Account</span>
                    <i data-lucide="user-plus"></i>
                </button>
            </form>
            
            <!-- Forgot Password Request Form (Step 1) -->
            <form id="forgot-password-form" class="auth-form hidden">
                <p class="auth-form-desc" style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                    Enter your registered email address. A 6-digit verification code will be generated in the server log console.
                </p>
                <div class="form-group">
                    <label for="forgot-email">Email Address</label>
                    <div class="input-wrapper">
                        <i data-lucide="mail" class="field-icon"></i>
                        <input type="email" id="forgot-email" required placeholder="name@example.com">
                    </div>
                </div>
                <div id="forgot-error-msg" class="auth-error-msg hidden"></div>
                <button type="submit" class="btn btn-primary btn-full">
                    <span>Send Verification Code</span>
                    <i data-lucide="send"></i>
                </button>
                <div class="form-helper-row" style="text-align: center; margin-top: 0.25rem;">
                    <a href="#" class="back-to-login-link auth-link-helper" style="font-size: 0.8rem; color: var(--text-link); text-decoration: none;">Back to Sign In</a>
                </div>
            </form>
            
            <!-- Reset Password Verification Form (Step 2) -->
            <form id="reset-password-form" class="auth-form hidden">
                <p class="auth-form-desc" style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                    Enter the 6-digit verification code from the console and choose a new password.
                </p>
                <div class="form-group">
                    <label for="reset-otp">Verification Code (6-digit)</label>
                    <div class="input-wrapper">
                        <i data-lucide="key-round" class="field-icon"></i>
                        <input type="text" id="reset-otp" required placeholder="e.g. 123456" pattern="\\d{6}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="reset-password">New Password</label>
                    <div class="input-wrapper">
                        <i data-lucide="lock" class="field-icon"></i>
                        <input type="password" id="reset-password" required placeholder="Minimum 6 characters">
                    </div>
                </div>
                <div class="form-group">
                    <label for="reset-confirm-password">Confirm New Password</label>
                    <div class="input-wrapper">
                        <i data-lucide="lock" class="field-icon"></i>
                        <input type="password" id="reset-confirm-password" required placeholder="Verify new password">
                    </div>
                </div>
                <div id="reset-error-msg" class="auth-error-msg hidden"></div>
                <button type="submit" class="btn btn-primary btn-full">
                    <span>Reset Password</span>
                    <i data-lucide="check-circle"></i>
                </button>
                <div class="form-helper-row" style="text-align: center; margin-top: 0.25rem;">
                    <a href="#" class="back-to-login-link auth-link-helper" style="font-size: 0.8rem; color: var(--text-link); text-decoration: none;">Back to Sign In</a>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modalDiv);
    lucide.createIcons();
    
    // Attach event listeners for forms
    getEl('close-auth-modal-btn').addEventListener('click', window.hideAuthModal);
    getEl('login-tab-btn').addEventListener('click', () => window.switchAuthTab('login'));
    getEl('signup-tab-btn').addEventListener('click', () => window.switchAuthTab('signup'));
    getEl('login-form').addEventListener('submit', handleLoginSubmit);
    getEl('signup-form').addEventListener('submit', handleSignupSubmit);
    getEl('forgot-password-btn').addEventListener('click', (e) => { e.preventDefault(); showForgotScreen(); });
    getEl('forgot-password-form').addEventListener('submit', handleForgotPasswordSubmit);
    getEl('reset-password-form').addEventListener('submit', handleResetPasswordSubmit);
    
    document.querySelectorAll('.back-to-login-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    });
}

// Form Handlers
async function handleLoginSubmit(e) {
    e.preventDefault();
    const loginErrorMsg = getEl('login-error-msg');
    loginErrorMsg.classList.add('hidden');
    
    const email = getEl('login-email').value.trim();
    const password = getEl('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.token = data.token;
            window.currentUser = data.user;
            localStorage.setItem('dse_auth_token', window.token);
            
            // Shortlist Merge Logic
            if (data.user.shortlist && data.user.shortlist.length > 0) {
                const localCodes = window.shortlistedColleges.map(c => c.choice_code);
                const combinedCodes = Array.from(new Set([...localCodes, ...data.user.shortlist]));
                window.shortlistedColleges = combinedCodes.map(code => ({ choice_code: code }));
                saveShortlistToLocalStorage();
                await window.syncShortlistWithCloud();
            } else if (window.shortlistedColleges.length > 0) {
                await window.syncShortlistWithCloud();
            }
            
            updateHeaderUI();
            updateDrawerUI();
            window.hideAuthModal();
            
            if (window.currentUser && window.currentUser.role === 'student') {
                showWelcomePopup(window.currentUser.username);
            }
            
            // Custom page triggers on login success
            if (typeof window.onAuthSuccess === 'function') {
                window.onAuthSuccess(window.currentUser);
            } else {
                window.location.reload();
            }
        } else {
            loginErrorMsg.textContent = data.message || 'Login failed';
            loginErrorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Login error:', err);
        loginErrorMsg.textContent = 'Server connection error. Please try again.';
        loginErrorMsg.classList.remove('hidden');
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const signupErrorMsg = getEl('signup-error-msg');
    signupErrorMsg.classList.add('hidden');
    
    const username = getEl('signup-username').value.trim();
    const email = getEl('signup-email').value.trim();
    const password = getEl('signup-password').value;
    const confirmPass = getEl('signup-confirm-password').value;
    const adminCode = getEl('signup-admin-code') ? getEl('signup-admin-code').value : '';
    
    if (password.length < 6) {
        signupErrorMsg.textContent = 'Password must be at least 6 characters.';
        signupErrorMsg.classList.remove('hidden');
        return;
    }
    
    if (password !== confirmPass) {
        signupErrorMsg.textContent = 'Passwords do not match.';
        signupErrorMsg.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, adminCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.token = data.token;
            window.currentUser = data.user;
            localStorage.setItem('dse_auth_token', window.token);
            
            if (window.shortlistedColleges.length > 0) {
                await window.syncShortlistWithCloud();
            }
            
            updateHeaderUI();
            updateDrawerUI();
            window.hideAuthModal();
            
            if (window.currentUser && window.currentUser.role === 'student') {
                showWelcomePopup(window.currentUser.username);
            }
            
            if (typeof window.onAuthSuccess === 'function') {
                window.onAuthSuccess(window.currentUser);
            } else {
                window.location.reload();
            }
        } else {
            signupErrorMsg.textContent = data.message || 'Registration failed';
            signupErrorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Signup error:', err);
        signupErrorMsg.textContent = 'Server connection error. Please try again.';
        signupErrorMsg.classList.remove('hidden');
    }
}

async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const forgotErrorMsg = getEl('forgot-error-msg');
    forgotErrorMsg.classList.add('hidden');
    
    const email = getEl('forgot-email').value.trim();
    
    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("Verification code generated!\n\nPlease retrieve the 6-digit code from the server console (terminal window) to proceed.");
            showResetScreen();
        } else {
            forgotErrorMsg.textContent = data.message || 'Error requesting reset code';
            forgotErrorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        forgotErrorMsg.textContent = 'Server connection error. Please try again.';
        forgotErrorMsg.classList.remove('hidden');
    }
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    const resetErrorMsg = getEl('reset-error-msg');
    resetErrorMsg.classList.add('hidden');
    
    const email = getEl('forgot-email').value.trim();
    const otp = getEl('reset-otp').value.trim();
    const newPassword = getEl('reset-password').value;
    const confirmPass = getEl('reset-confirm-password').value;
    
    if (newPassword.length < 6) {
        resetErrorMsg.textContent = 'Password must be at least 6 characters.';
        resetErrorMsg.classList.remove('hidden');
        return;
    }
    
    if (newPassword !== confirmPass) {
        resetErrorMsg.textContent = 'Passwords do not match.';
        resetErrorMsg.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("Password updated successfully! You can now sign in with your new credentials.");
            showLoginScreen();
        } else {
            resetErrorMsg.textContent = data.message || 'Reset failed';
            resetErrorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Reset password error:', err);
        resetErrorMsg.textContent = 'Server connection error. Please try again.';
        resetErrorMsg.classList.remove('hidden');
    }
}

// Student Welcome Popup Guide
function showWelcomePopup(username) {
    const firstName = username.split(' ')[0];
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(6, 9, 22, 0.85)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '3000';
    overlay.style.padding = '1.5rem';
    overlay.className = 'animate-fade-in';
    
    const card = document.createElement('div');
    card.className = 'Card';
    card.style.maxWidth = '460px';
    card.style.width = '100%';
    card.style.padding = '2.5rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '1.5rem';
    card.style.position = 'relative';
    card.style.textAlign = 'center';
    card.style.border = '1px solid hsla(250, 89%, 65%, 0.3)';
    card.style.boxShadow = '0 20px 50px rgba(100, 50, 255, 0.2)';
    
    card.innerHTML = `
        <div style="background: linear-gradient(135deg, var(--primary), var(--dream-color)); width: 60px; height: 60px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto; color: white; box-shadow: 0 0 20px rgba(100, 50, 255, 0.4);">
            <i data-lucide="sparkles" style="width: 30px; height: 30px;"></i>
        </div>
        <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Welcome, ${firstName}!</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">Here is a quick guide to help you find the best colleges:</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left; background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="color: var(--primary-hover); margin-top: 0.15rem;"><i data-lucide="bookmark-check" style="width: 18px; height: 18px;"></i></div>
                <div>
                    <strong style="color: #fff; font-size: 0.85rem;">Shortlist Your Choices</strong>
                    <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.1rem;">Click the bookmark icon on any college recommendation card to add it to your shortlist.</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="color: var(--match-color); margin-top: 0.15rem;"><i data-lucide="download" style="width: 18px; height: 18px;"></i></div>
                <div>
                    <strong style="color: #fff; font-size: 0.85rem;">Download PDF & Excel</strong>
                    <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.1rem;">Open the Shortlist panel at the top right to download your list as an Excel sheet (CSV) or print a PDF helper.</p>
                </div>
            </div>
        </div>
        
        <button id="welcome-popup-close-btn" class="btn btn-primary" style="width: 100%; padding: 0.85rem;">
            <span>Get Started</span>
            <i data-lucide="arrow-right"></i>
        </button>
    `;
    
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    lucide.createIcons();
    
    card.querySelector('#welcome-popup-close-btn').addEventListener('click', () => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    });
}

// Map college code and name to university affiliation and autonomy status
window.getCollegeAffiliation = function(code, name) {
    const nameUpper = name.toUpperCase();
    const isAutonomous = nameUpper.includes("AUTONOMOUS");
    let university = "";
    
    if (nameUpper.includes("SANT GADGE BABA") || nameUpper.includes("AMRAVATI UNIVERSITY")) {
        university = "Sant Gadge Baba Amravati University";
    } else if (nameUpper.includes("BATU") || nameUpper.includes("TECHNOLOGICAL UNIVERSITY") || nameUpper.includes("DBATU")) {
        university = "Dr. Babasaheb Ambedkar Technological University";
    } else if (nameUpper.includes("MUMBAI UNIVERSITY") || nameUpper.includes("UNIVERSITY OF MUMBAI")) {
        university = "University of Mumbai";
    } else if (nameUpper.includes("PUNE UNIVERSITY") || nameUpper.includes("SAVITRIBAI PHULE")) {
        university = "Savitribai Phule Pune University";
    } else if (nameUpper.includes("NAGPUR UNIVERSITY") || nameUpper.includes("RTMNU") || nameUpper.includes("TUKADOJI MAHARAJ")) {
        university = "Rashtrasant Tukadoji Maharaj Nagpur University";
    } else if (nameUpper.includes("SHIVAJI UNIVERSITY")) {
        university = "Shivaji University, Kolhapur";
    } else if (nameUpper.includes("SNDT")) {
        university = "SNDT Women's University";
    } else if (nameUpper.includes("SOLAPUR UNIVERSITY") || nameUpper.includes("PUNYASHLOK")) {
        university = "Punyashlok Ahilyadevi Holkar Solapur University";
    } else if (nameUpper.includes("NANDED") || nameUpper.includes("SWAMI RAMANAND")) {
        university = "Swami Ramanand Teerth Marathwada University";
    } else if (nameUpper.includes("JALGAON") || nameUpper.includes("KAVAYITRI")) {
        university = "Kavayitri Bahinabai Chaudhari North Maharashtra University";
    } else if (nameUpper.includes("AURANGABAD") || nameUpper.includes("BAMU") || nameUpper.includes("BABASAHEB AMBEDKAR MARATHWADA")) {
        university = "Dr. Babasaheb Ambedkar Marathwada University";
    } else {
        university = "Affiliated to State Board / DTE Maharashtra";
    }
    
    return { university, isAutonomous };
};

// Mobile Drawer Toggle Methods
window.showMobileDrawer = function() {
    let drawer = getEl('mobile-drawer');
    let overlay = getEl('mobile-drawer-overlay');
    
    if (!drawer || !overlay) {
        injectMobileDrawerHTML();
        drawer = getEl('mobile-drawer');
        overlay = getEl('mobile-drawer-overlay');
    }
    
    overlay.classList.add('show');
    drawer.classList.add('open');
    updateDrawerUI();
};

window.hideMobileDrawer = function() {
    const drawer = getEl('mobile-drawer');
    const overlay = getEl('mobile-drawer-overlay');
    
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
};

// Inject Mobile Drawer HTML
function injectMobileDrawerHTML() {
    if (getEl('mobile-drawer')) return;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'mobile-drawer-overlay';
    overlay.className = 'mobile-drawer-overlay';
    document.body.appendChild(overlay);
    
    // Create drawer
    const drawer = document.createElement('aside');
    drawer.id = 'mobile-drawer';
    drawer.className = 'mobile-drawer';
    
    // Check active path for active class highlight
    const path = window.location.pathname;
    const isHome = path === '/' || path.includes('index.html');
    const isPredictor = path.includes('predictor');
    const isFees = path.includes('fees') || path.includes('college-details');
    const isDocs = path.includes('documents');
    const isReviews = path.includes('reviews');
    
    drawer.innerHTML = `
        <div class="mobile-drawer-header">
            <div class="mobile-drawer-brand">
                <div class="logo-glow">
                    <i data-lucide="graduation-cap"></i>
                </div>
                <h3>DSE Finder</h3>
            </div>
            <button id="mobile-drawer-close-btn" class="icon-btn" aria-label="Close menu">
                <i data-lucide="x"></i>
            </button>
        </div>
        
        <nav class="mobile-drawer-menu">
            <a href="/" class="mobile-drawer-item ${isHome ? 'active' : ''}">
                <i data-lucide="home"></i>
                <span>Home</span>
            </a>
            <a href="/predictor" class="mobile-drawer-item ${isPredictor ? 'active' : ''}">
                <i data-lucide="sparkles"></i>
                <span>Predictor</span>
            </a>
            <a href="/fees" class="mobile-drawer-item ${isFees ? 'active' : ''}">
                <i data-lucide="indian-rupee"></i>
                <span>College Fees</span>
            </a>
            <a href="/documents" class="mobile-drawer-item ${isDocs ? 'active' : ''}">
                <i data-lucide="file-text"></i>
                <span>Documents</span>
            </a>
            <a href="/reviews" class="mobile-drawer-item ${isReviews ? 'active' : ''}">
                <i data-lucide="message-square"></i>
                <span>Reviews</span>
            </a>
        </nav>
        
        <div class="mobile-drawer-footer" id="mobile-drawer-user-footer">
            <!-- Populated dynamically via updateDrawerUI -->
        </div>
    `;
    
    document.body.appendChild(drawer);
    lucide.createIcons();
    
    // Attach event listeners
    overlay.addEventListener('click', window.hideMobileDrawer);
    getEl('mobile-drawer-close-btn').addEventListener('click', window.hideMobileDrawer);
}

// Bind elements on load
document.addEventListener('DOMContentLoaded', () => {
    // Desktop binding
    const signinBtn = getEl('header-signin-btn');
    if (signinBtn) {
        signinBtn.addEventListener('click', () => window.showAuthModal('login'));
    }
    
    const profileTrigger = getEl('profile-trigger-btn');
    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const list = document.querySelector('.dropdown-menu-list');
            if (list) list.classList.toggle('hidden');
        });
    }
    
    document.addEventListener('click', () => {
        const list = document.querySelector('.dropdown-menu-list');
        if (list) list.classList.add('hidden');
    });
    
    const signoutBtn = getEl('header-signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', window.handleSignout);
    }
    
    // Hamburger trigger binding
    const hamburger = document.querySelector('.hamburger-btn');
    if (hamburger) {
        hamburger.addEventListener('click', window.showMobileDrawer);
    }
    
    // Check session
    window.loadShortlistFromLocalStorage();
    window.checkUserSession();
});
