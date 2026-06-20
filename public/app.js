// Application Data & State
let cutoffData = [];
let shortlistedColleges = [];
let token = localStorage.getItem('dse_auth_token') || null;
let currentUser = null;
let editingReviewId = null;
let loadedReviews = [];

// DOM Elements
const form = document.getElementById('predictor-form');
const pctInput = document.getElementById('student-percentage');
const categorySelect = document.getElementById('seat-category');
const branchSelect = document.getElementById('branch-selector');
const yearSelect = document.getElementById('academic-year');
const roundSelect = document.getElementById('cap-round');
const predictBtn = document.getElementById('predict-btn');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('results-section');

const countDream = document.getElementById('count-dream');
const countMatch = document.getElementById('count-match');
const countSafe = document.getElementById('count-safe');

const gridDream = document.getElementById('grid-dream');
const gridMatch = document.getElementById('grid-match');
const gridSafe = document.getElementById('grid-safe');

const badgeDream = document.getElementById('badge-dream');
const badgeMatch = document.getElementById('badge-match');
const badgeSafe = document.getElementById('badge-safe');

const groupDreamSection = document.getElementById('group-dream-section');
const groupMatchSection = document.getElementById('group-match-section');
const groupSafeSection = document.getElementById('group-safe-section');

const collegeSearchInput = document.getElementById('college-search');
const noResultsMsg = document.getElementById('no-results-msg');

const viewShortlistBtn = document.getElementById('view-shortlist-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const shortlistDrawer = document.getElementById('shortlist-drawer');
const shortlistBadge = document.getElementById('shortlist-badge');
const shortlistItemsContainer = document.getElementById('shortlist-items');
const clearShortlistBtn = document.getElementById('clear-shortlist-btn');
const printShortlistBtn = document.getElementById('print-shortlist-btn');
const downloadShortlistBtn = document.getElementById('download-shortlist-btn');
const downloadResultsBtn = document.getElementById('download-results-btn');
const printTableBody = document.getElementById('print-table-body');
const getStartedBtn = document.getElementById('get-started-btn');

// Auth DOM Elements
const authModal = document.getElementById('auth-modal');
const headerSigninBtn = document.getElementById('header-signin-btn');
const headerProfileDropdown = document.getElementById('header-profile-dropdown');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const loginTabBtn = document.getElementById('login-tab-btn');
const signupTabBtn = document.getElementById('signup-tab-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const profileTriggerBtn = document.getElementById('profile-trigger-btn');
const headerSignoutBtn = document.getElementById('header-signout-btn');
const syncShortlistStatus = document.getElementById('sync-shortlist-status');
const userAvatar = document.getElementById('user-avatar');
const userDisplay = document.getElementById('user-display');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupUsernameInput = document.getElementById('signup-username');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
const loginErrorMsg = document.getElementById('login-error-msg');
const signupErrorMsg = document.getElementById('signup-error-msg');

// Forgot / Reset DOM Elements
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const backToLoginLinks = document.querySelectorAll('.back-to-login-link');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const forgotEmailInput = document.getElementById('forgot-email');
const resetOtpInput = document.getElementById('reset-otp');
const resetPasswordInput = document.getElementById('reset-password');
const resetConfirmPasswordInput = document.getElementById('reset-confirm-password');
const forgotErrorMsg = document.getElementById('forgot-error-msg');
const resetErrorMsg = document.getElementById('reset-error-msg');

// Reviews DOM Elements
const reviewForm = document.getElementById('review-form');
const reviewCommentInput = document.getElementById('review-comment');
const reviewErrorMsg = document.getElementById('review-error-msg');
const reviewGuestCta = document.getElementById('review-guest-cta');
const reviewSigninBtn = document.getElementById('review-signin-btn');
const reviewsLoader = document.getElementById('reviews-loader');
const reviewsList = document.getElementById('reviews-list');
const emptyReviewsMsg = document.getElementById('empty-reviews-msg');
const starRatingInput = document.getElementById('star-rating-input');
const selectedRatingInput = document.getElementById('selected-rating');
const reviewFormTitle = document.getElementById('review-form-title');
const reviewSubmitText = document.getElementById('review-submit-text');
const reviewCancelBtn = document.getElementById('review-cancel-btn');
const reviewAlreadySubmittedMsg = document.getElementById('review-already-submitted-msg');

// Category Code Mappings to Friendly Names
const CATEGORY_MAP = {
    "GOPEN": "GOPEN (General Open)",
    "LOPEN": "LOPEN (Ladies Open)",
    "GOBC": "GOBC (General OBC)",
    "LOBC": "LOBC (Ladies OBC)",
    "EWS": "EWS (Economically Weaker)",
    "GSC": "GSC (General SC)",
    "LSC": "LSC (Ladies SC)",
    "GST": "GST (General ST)",
    "LST": "LST (Ladies ST)",
    "GSEBC": "GSEBC (General SEBC)",
    "LSEBC": "LSEBC (Ladies SEBC)",
    "GNTA": "GNTA (General NT-A)",
    "LNTA": "LNTA (Ladies NT-A)",
    "GNTB": "GNTB (General NT-B)",
    "LNTB": "LNTB (Ladies NT-B)",
    "GNTC": "GNTC (General NT-C)",
    "LNTC": "LNTC (Ladies NT-C)",
    "GNTD": "GNTD (General NT-D)",
    "LNTD": "LNTD (Ladies NT-D)",
    "MI": "MI (Minority Seats)",
    "PWD-O": "PWD-O (PWD Open)",
    "PWDR-SC": "PWDR-SC (PWD SC)",
    "PWDR-ST": "PWDR-ST (PWD ST)",
    "PWDR-OBC": "PWDR-OBC (PWD OBC)",
    "PWDR-SEBC": "PWDR-SEBC (PWD SEBC)",
    "DEF-O": "DEF-O (Defence Open)",
    "DEFR-OBC": "DEFR-OBC (Defence OBC)",
    "DEFR-SC": "DEFR-SC (Defence SC)",
    "DEFR-SEBC": "DEFR-SEBC (Defence SEBC)",
    "ORP": "ORP (Orphan Seats)"
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Load Shortlist from LocalStorage (Fallback)
    loadShortlistFromStorage();
    
    // Initialize User Session
    await checkUserSession();
    
    // Load JSON Data
    try {
        loader.classList.remove('hidden');
        const response = await fetch('dse_cutoff_data.json');
        if (!response.ok) throw new Error("Failed to fetch cutoff data");
        cutoffData = await response.json();
        
        // Extract filters and populate selects
        populateFilters();
        
        // If we have parsed JSON, sync actual shortlisted objects (if choice codes were loaded)
        reconcileShortlistObjects();
    } catch (err) {
        console.error("Initialization error:", err);
        alert("Error loading cutoff data. Please check your network connection.");
    } finally {
        loader.classList.add('hidden');
    }
    
    // Set up Event Listeners
    form.addEventListener('submit', handlePredict);
    collegeSearchInput.addEventListener('input', handleFilterSearch);
    
    // Enforce authentication on Get Started button
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            if (!token || !currentUser) {
                e.preventDefault();
                showAuthModal('login');
                loginErrorMsg.textContent = "Please sign in or create an account first to get started.";
                loginErrorMsg.classList.remove('hidden');
            }
        });
    }
    
    // Shortlist Drawer triggers
    viewShortlistBtn.addEventListener('click', toggleShortlistDrawer);
    closeDrawerBtn.addEventListener('click', toggleShortlistDrawer);
    clearShortlistBtn.addEventListener('click', clearShortlist);
    printShortlistBtn.addEventListener('click', printShortlist);
    if (downloadShortlistBtn) {
        downloadShortlistBtn.addEventListener('click', downloadShortlistCSV);
    }
    if (downloadResultsBtn) {
        downloadResultsBtn.addEventListener('click', downloadResultsCSV);
    }
    
    // Auth Modal triggers
    headerSigninBtn.addEventListener('click', () => showAuthModal('login'));
    closeAuthModalBtn.addEventListener('click', hideAuthModal);
    loginTabBtn.addEventListener('click', () => switchAuthTab('login'));
    signupTabBtn.addEventListener('click', () => switchAuthTab('signup'));
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    headerSignoutBtn.addEventListener('click', handleSignout);
    
    // Forgot Password and Reset Password triggers
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotScreen();
        });
    }
    
    backToLoginLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    });
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordRequest);
    }
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
    
    // Dropdown profile toggle
    profileTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.querySelector('.dropdown-menu-list');
        menu.classList.toggle('hidden');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        const menu = document.querySelector('.dropdown-menu-list');
        if (menu) menu.classList.add('hidden');
    });
    
    // Reviews Section listeners & init
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    if (reviewSigninBtn) {
        reviewSigninBtn.addEventListener('click', () => showAuthModal('login'));
    }
    if (reviewCancelBtn) {
        reviewCancelBtn.addEventListener('click', () => cancelEditReview());
    }
    setupStarRatingInteractive();
    fetchReviews();
    
    // Animate stats values with a writing reveal effect on reload
    animateStatsWriting();
});

// Populate Select Filters dynamically from nesting
function populateFilters() {
    const branches = new Set();
    const categories = new Set();
    
    cutoffData.forEach(item => {
        if (item.branch_name) branches.add(item.branch_name);
        if (item.cutoffs) {
            Object.keys(item.cutoffs).forEach(year => {
                Object.keys(item.cutoffs[year]).forEach(roundNum => {
                    Object.keys(item.cutoffs[year][roundNum]).forEach(cat => categories.add(cat));
                });
            });
        }
    });
    
    // Populate Categories (Sort common ones first)
    const sortedCategories = Array.from(categories).sort((a, b) => {
        const priority = ["GOPEN", "LOPEN", "GOBC", "LOBC", "EWS", "GSC", "LSC"];
        const idxA = priority.indexOf(a);
        const idxB = priority.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    // Clear dynamic categories except placeholder
    categorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
    sortedCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = CATEGORY_MAP[cat] || cat;
        categorySelect.appendChild(option);
    });
    
    // Clear dynamic branches except placeholder
    branchSelect.innerHTML = '<option value="ALL">All Branches</option>';
    const sortedBranches = Array.from(branches).sort();
    sortedBranches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        branchSelect.appendChild(option);
    });
}

// Current filter results state
let lastResults = { dream: [], match: [], safe: [] };

// Predict Button submission handler
function handlePredict(e) {
    e.preventDefault();
    
    // Enforce login requirement for searching colleges
    if (!token || !currentUser) {
        showAuthModal('login');
        loginErrorMsg.textContent = "Please sign in or create an account first to search for colleges.";
        loginErrorMsg.classList.remove('hidden');
        updatePredictorLockStatus();
        return;
    }
    
    // Enforce review submission requirement
    if (!hasUserReviewed()) {
        updatePredictorLockStatus();
        const lockMsg = document.getElementById('predictor-lock-msg');
        if (lockMsg) {
            lockMsg.classList.remove('hidden');
            lockMsg.style.transform = 'scale(1.02)';
            setTimeout(() => lockMsg.style.transform = 'none', 300);
        }
        
        // Smooth scroll to the reviews section
        const reviewsSec = document.getElementById('reviews-section');
        if (reviewsSec) {
            reviewsSec.scrollIntoView({ behavior: 'smooth' });
            
            // Flash the reviews section write-review-panel
            const writePanel = document.querySelector('.write-review-panel');
            if (writePanel) {
                writePanel.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.4)';
                writePanel.style.transition = 'box-shadow 0.3s ease';
                setTimeout(() => {
                    writePanel.style.boxShadow = 'none';
                }, 2000);
            }
        }
        return;
    }
    
    const percentage = parseFloat(pctInput.value);
    const category = categorySelect.value;
    const branch = branchSelect.value;
    const selectedYear = yearSelect.value;
    const selectedRound = roundSelect.value;
    
    if (isNaN(percentage) || !category) {
        alert("Please enter a valid percentage and select your category.");
        return;
    }
    
    loader.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    noResultsMsg.classList.add('hidden');
    
    // Perform processing asynchronously to allow UI thread to draw loader
    setTimeout(() => {
        const dream = [];
        const match = [];
        const safe = [];
        
        cutoffData.forEach(item => {
            // Filter by branch if not ALL
            if (branch !== "ALL" && item.branch_name !== branch) {
                return;
            }
            
            // Check if selected year, round, and category has cutoff data
            if (
                item.cutoffs &&
                item.cutoffs[selectedYear] &&
                item.cutoffs[selectedYear][selectedRound] &&
                item.cutoffs[selectedYear][selectedRound][category]
            ) {
                const [rank, pct, stage] = item.cutoffs[selectedYear][selectedRound][category];
                const diff = pct - percentage;
                
                const collegeResult = {
                    ...item,
                    cutoffPct: pct,
                    cutoffRank: rank,
                    stage: stage === 1 ? "Stage-I" : stage === 2 ? "Stage-II" : "Stage-III",
                    category: category,
                    selectedYear: selectedYear,
                    selectedRound: selectedRound
                };
                
                // Grouping logic
                if (diff > 0 && diff <= 2.0) {
                    dream.push(collegeResult);
                } else if (diff <= 0 && diff >= -5.0) {
                    match.push(collegeResult);
                } else if (diff < -5.0) {
                    safe.push(collegeResult);
                }
            }
        });
        
        // Sort each group by cutoff percentage descending (highest cutoffs first)
        const sortByPct = (a, b) => b.cutoffPct - a.cutoffPct;
        dream.sort(sortByPct);
        match.sort(sortByPct);
        safe.sort(sortByPct);
        
        lastResults = { dream, match, safe };
        
        // Render
        renderResults();
        
        loader.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// Render Results cards to grids
function renderResults(searchQuery = "") {
    const query = searchQuery.trim().toLowerCase();
    
    // Filter results based on search query
    const filterByQuery = item => {
        if (!query) return true;
        return (
            item.college_name.toLowerCase().includes(query) ||
            item.college_code.includes(query) ||
            item.choice_code.includes(query) ||
            item.branch_name.toLowerCase().includes(query)
        );
    };
    
    const filteredDream = lastResults.dream.filter(filterByQuery);
    const filteredMatch = lastResults.match.filter(filterByQuery);
    const filteredSafe = lastResults.safe.filter(filterByQuery);
    
    // Set counts
    countDream.textContent = filteredDream.length;
    countMatch.textContent = filteredMatch.length;
    countSafe.textContent = filteredSafe.length;
    
    badgeDream.textContent = filteredDream.length;
    badgeMatch.textContent = filteredMatch.length;
    badgeSafe.textContent = filteredSafe.length;
    
    // Show/hide sections based on empty status
    toggleSectionVisibility(groupDreamSection, filteredDream.length);
    toggleSectionVisibility(groupMatchSection, filteredMatch.length);
    toggleSectionVisibility(groupSafeSection, filteredSafe.length);
    
    // Check if any results at all
    const totalCount = filteredDream.length + filteredMatch.length + filteredSafe.length;
    if (totalCount === 0) {
        noResultsMsg.classList.remove('hidden');
    } else {
        noResultsMsg.classList.add('hidden');
    }
    
    // Render each grid
    renderGrid(gridDream, filteredDream, 'dream');
    renderGrid(gridMatch, filteredMatch, 'match');
    renderGrid(gridSafe, filteredSafe, 'safe');
    
    // Re-create lucide icons in dynamically added elements
    lucide.createIcons();
}

function toggleSectionVisibility(section, length) {
    if (length === 0) {
        section.classList.add('hidden');
    } else {
        section.classList.remove('hidden');
    }
}

// Render helper for single group grid with trends and university affiliation
function renderGrid(container, items, safetyClass) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const isShortlisted = shortlistedColleges.some(sc => sc.choice_code === item.choice_code);
        
        // Gather historical trend data for the current category
        const trendPills = [];
        const yearsToTrack = ["2025-26", "2024-25"];
        const roundsToTrack = ["1", "2"];
        
        yearsToTrack.forEach(y => {
            roundsToTrack.forEach(r => {
                if (item.cutoffs && item.cutoffs[y] && item.cutoffs[y][r] && item.cutoffs[y][r][item.category]) {
                    const [trank, tpct, tstage] = item.cutoffs[y][r][item.category];
                    const isCurrent = (y === item.selectedYear && r === item.selectedRound);
                    trendPills.push({
                        label: `${y.replace("20", "")} R${r}`,
                        pct: tpct,
                        isCurrent: isCurrent
                    });
                }
            });
        });
        
        const aff = getCollegeAffiliation(item.college_code, item.college_name);
        let affiliationHTML = "";
        if (aff.university) {
            affiliationHTML = `
                <div class="college-affiliation">
                    <i data-lucide="building"></i>
                    <span>${aff.university}</span>
                    ${aff.isAutonomous ? `<span class="autonomy-badge">Autonomous</span>` : ''}
                </div>
            `;
        } else if (aff.isAutonomous) {
            affiliationHTML = `
                <div class="college-affiliation">
                    <i data-lucide="building"></i>
                    <span class="autonomy-badge">Autonomous College</span>
                </div>
            `;
        }

        const card = document.createElement('article');
        card.className = `college-card Card ${safetyClass}`;
        
        card.innerHTML = `
            <div>
                <div class="card-top">
                    <span class="college-code">Code: ${item.college_code}</span>
                    <button class="bookmark-btn icon-btn ${isShortlisted ? 'active' : ''}" 
                            onclick="toggleShortlist('${item.choice_code}')"
                            aria-label="${isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}">
                        <i data-lucide="bookmark"></i>
                    </button>
                </div>
                <h4 class="college-name">${item.college_name}</h4>
                ${affiliationHTML}
                <div class="card-middle">
                    <div class="info-item">
                        <i data-lucide="git-branch"></i>
                        <span class="branch-name-val">${item.branch_name}</span>
                    </div>
                    <div class="info-item">
                        <i data-lucide="hash"></i>
                        <span class="choice-code-val">Choice Code: ${item.choice_code}</span>
                    </div>
                </div>
                
                <!-- Historical Trend Pills Section -->
                ${trendPills.length > 0 ? `
                <div class="card-trends">
                    <div class="trends-title">
                        <i data-lucide="trending-up"></i>
                        <span>Cutoff Trend (${item.category})</span>
                    </div>
                    <div class="trends-grid">
                        ${trendPills.map(p => `
                            <span class="trend-badge ${p.isCurrent ? 'highlight' : ''}" 
                                  title="${p.isCurrent ? 'Current prediction year & round' : ''}">
                                ${p.label}: <strong>${p.pct.toFixed(2)}%</strong>
                            </span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="card-bottom" style="margin-top: 1rem;">
                <div class="cutoff-details ${safetyClass}">
                    <div class="cutoff-lbl">${item.category} Cutoff (${item.selectedYear.replace("20", "")} R${item.selectedRound})</div>
                    <div class="cutoff-pct">${item.cutoffPct.toFixed(2)}%</div>
                    <div class="cutoff-rank">Rank: ${item.cutoffRank ? item.cutoffRank.toLocaleString() : 'N/A'}</div>
                </div>
                <div class="cutoff-stage">${item.stage}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filter results dynamically as user types
function handleFilterSearch(e) {
    renderResults(e.target.value);
}

// Toggle floating shortlist drawer open/close
function toggleShortlistDrawer() {
    shortlistDrawer.classList.toggle('open');
}

// Add/Remove college from shortlist
window.toggleShortlist = async function(choiceCode) {
    const isAlreadyShortlisted = shortlistedColleges.some(sc => sc.choice_code === choiceCode);
    
    if (isAlreadyShortlisted) {
        // Remove
        shortlistedColleges = shortlistedColleges.filter(sc => sc.choice_code !== choiceCode);
    } else {
        // Add (find in results or global data)
        let found = null;
        const allResults = [...lastResults.dream, ...lastResults.match, ...lastResults.safe];
        found = allResults.find(r => r.choice_code === choiceCode);
        
        if (!found) {
            found = cutoffData.find(c => c.choice_code === choiceCode);
        }
        
        if (found) {
            shortlistedColleges.push(found);
        }
    }
    
    saveShortlistToStorage();
    renderShortlist();
    
    // Sync with MongoDB cloud if logged in
    if (token && currentUser) {
        await syncShortlistWithCloud();
    }
    
    // Refresh main grids to update bookmark icon visual states
    const query = collegeSearchInput.value;
    renderResults(query);
};

// Remove single item from shortlist drawer
window.removeFromShortlist = function(choiceCode) {
    window.toggleShortlist(choiceCode);
};

// Render Shorlist Drawer Items
function renderShortlist() {
    shortlistBadge.textContent = shortlistedColleges.length;
    
    if (shortlistedColleges.length === 0) {
        shortlistItemsContainer.innerHTML = `
            <div class="empty-shortlist">
                <i data-lucide="plus-circle"></i>
                <p>No colleges shortlisted yet. Click the bookmark icon on college cards to add them here.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    shortlistItemsContainer.innerHTML = '';
    shortlistedColleges.forEach((item, idx) => {
        if (!item) return;
        const itemCard = document.createElement('div');
        itemCard.className = 'shortlisted-card';
        
        // Retrieve matched cutoff details for currently selected filters
        const currentCategory = categorySelect.value || "GOPEN";
        const currentYear = yearSelect.value || "2025-26";
        const currentRound = roundSelect.value || "1";
        
        let pct = 0.0;
        
        if (item.cutoffs && item.cutoffs[currentYear] && item.cutoffs[currentYear][currentRound] && item.cutoffs[currentYear][currentRound][currentCategory]) {
            const [cRank, cPct, cStage] = item.cutoffs[currentYear][currentRound][currentCategory];
            pct = cPct;
        } else if (item.cutoffs) {
            // Fallback: search for any cutoff in the category
            outer: for (const y of Object.keys(item.cutoffs)) {
                for (const r of Object.keys(item.cutoffs[y])) {
                    if (item.cutoffs[y][r][currentCategory]) {
                        pct = item.cutoffs[y][r][currentCategory][1];
                        break outer;
                    }
                }
            }
        }
        
        itemCard.innerHTML = `
            <button class="item-remove icon-btn" onclick="removeFromShortlist('${item.choice_code}')" aria-label="Remove item">
                <i data-lucide="trash-2"></i>
            </button>
            <h4>${idx + 1}. ${item.college_name}</h4>
            <p>${item.branch_name}</p>
            <div class="item-meta">
                <span class="item-code">Code: ${item.choice_code}</span>
                <span class="item-cutoff">${pct > 0 ? pct.toFixed(2) + '%' : 'N/A'} (${currentCategory})</span>
            </div>
        `;
        shortlistItemsContainer.appendChild(itemCard);
    });
    
    lucide.createIcons();
}

// Clear all items in shortlist
async function clearShortlist() {
    if (shortlistedColleges.length === 0) return;
    if (confirm("Are you sure you want to clear your shortlist?")) {
        shortlistedColleges = [];
        saveShortlistToStorage();
        renderShortlist();
        
        // Sync with MongoDB cloud if logged in
        if (token && currentUser) {
            await syncShortlistWithCloud();
        }
        
        // Refresh cards visual state
        const query = collegeSearchInput.value;
        renderResults(query);
    }
}

// Trigger Print Options Helper
function printShortlist() {
    if (shortlistedColleges.length === 0) {
        alert("Please add at least one college to your shortlist before printing.");
        return;
    }
    
    // Populate print table body
    printTableBody.innerHTML = '';
    
    shortlistedColleges.forEach((item, idx) => {
        if (!item) return;
        const currentCategory = categorySelect.value || "GOPEN";
        const currentYear = yearSelect.value || "2025-26";
        const currentRound = roundSelect.value || "1";
        
        let pct = 0.0;
        let rank = null;
        let stageStr = "Stage-I";
        
        if (item.cutoffs && item.cutoffs[currentYear] && item.cutoffs[currentYear][currentRound] && item.cutoffs[currentYear][currentRound][currentCategory]) {
            const [cRank, cPct, cStage] = item.cutoffs[currentYear][currentRound][currentCategory];
            pct = cPct;
            rank = cRank;
            stageStr = cStage === 1 ? "Stage-I" : cStage === 2 ? "Stage-II" : "Stage-III";
        } else if (item.cutoffs) {
            // Fallback: search for any cutoff in the category
            outer: for (const y of Object.keys(item.cutoffs)) {
                for (const r of Object.keys(item.cutoffs[y])) {
                    if (item.cutoffs[y][r][currentCategory]) {
                        const [cRank, cPct, cStage] = item.cutoffs[y][r][currentCategory];
                        pct = cPct;
                        rank = cRank;
                        stageStr = cStage === 1 ? "Stage-I" : cStage === 2 ? "Stage-II" : "Stage-III";
                        break outer;
                    }
                }
            }
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>${item.college_code}</td>
            <td>${item.college_name}</td>
            <td><code>${item.choice_code}</code></td>
            <td>${item.branch_name}</td>
            <td>${pct > 0 ? pct.toFixed(2) + '%' : 'N/A'} (Rank ${rank ? rank.toLocaleString() : 'N/A'}, ${currentCategory}, ${stageStr})</td>
        `;
        printTableBody.appendChild(tr);
    });
    
    // Open Print Dialog
    window.print();
}

// Download Shortlist as CSV file
function downloadShortlistCSV() {
    if (shortlistedColleges.length === 0) {
        alert("Please add at least one college to your shortlist before downloading.");
        return;
    }
    
    const currentCategory = categorySelect.value || "GOPEN";
    const currentYear = yearSelect.value || "2025-26";
    const currentRound = roundSelect.value || "1";
    
    const headers = [
        "Preference",
        "College Code",
        "Choice Code",
        "College Name",
        "Preferred Branch",
        "Admission Category",
        "Cutoff Percentage",
        "Cutoff Rank",
        "Cutoff Stage",
        "Academic Year",
        "CAP Round"
    ];
    
    const rows = shortlistedColleges.map((item, idx) => {
        if (!item) return null;
        
        let pct = "N/A";
        let rank = "N/A";
        let stageStr = "Stage-I";
        
        if (item.cutoffs && item.cutoffs[currentYear] && item.cutoffs[currentYear][currentRound] && item.cutoffs[currentYear][currentRound][currentCategory]) {
            const [cRank, cPct, cStage] = item.cutoffs[currentYear][currentRound][currentCategory];
            pct = cPct.toFixed(2);
            rank = cRank;
            stageStr = cStage === 1 ? "Stage-I" : cStage === 2 ? "Stage-II" : "Stage-III";
        } else if (item.cutoffs) {
            // Fallback: search for any cutoff in the category
            outer: for (const y of Object.keys(item.cutoffs)) {
                for (const r of Object.keys(item.cutoffs[y])) {
                    if (item.cutoffs[y][r][currentCategory]) {
                        const [cRank, cPct, cStage] = item.cutoffs[y][r][currentCategory];
                        pct = cPct.toFixed(2);
                        rank = cRank;
                        stageStr = cStage === 1 ? "Stage-I" : cStage === 2 ? "Stage-II" : "Stage-III";
                        break outer;
                    }
                }
            }
        }
        
        return [
            idx + 1,
            item.college_code,
            item.choice_code,
            item.college_name,
            item.branch_name,
            currentCategory,
            pct,
            rank,
            stageStr,
            currentYear,
            currentRound
        ];
    }).filter(Boolean);
    
    const csvContent = convertToCSV(headers, rows);
    const filename = `dse_shortlist_${currentCategory}_${currentYear}_R${currentRound}.csv`;
    triggerCSVDownload(filename, csvContent);
}

// Download predicted results list as CSV file
function downloadResultsCSV() {
    const searchQuery = collegeSearchInput.value.trim().toLowerCase();
    const filterByQuery = item => {
        if (!searchQuery) return true;
        return (
            item.college_name.toLowerCase().includes(searchQuery) ||
            item.college_code.includes(searchQuery) ||
            item.choice_code.includes(searchQuery) ||
            item.branch_name.toLowerCase().includes(searchQuery)
        );
    };
    
    const filteredDream = lastResults.dream.filter(filterByQuery);
    const filteredMatch = lastResults.match.filter(filterByQuery);
    const filteredSafe = lastResults.safe.filter(filterByQuery);
    
    const totalCount = filteredDream.length + filteredMatch.length + filteredSafe.length;
    if (totalCount === 0) {
        alert("No results to download. Please search or adjust your percentage criteria.");
        return;
    }
    
    const studentPct = parseFloat(pctInput.value);
    const currentCategory = categorySelect.value || "GOPEN";
    const currentYear = yearSelect.value || "2025-26";
    const currentRound = roundSelect.value || "1";
    
    const headers = [
        "Recommendation Group",
        "College Code",
        "Choice Code",
        "College Name",
        "Branch Name",
        "Admission Category",
        "Cutoff Percentage",
        "Cutoff Rank",
        "Cutoff Stage",
        "Your Percentage",
        "Difference (Cutoff - Your Pct)",
        "Academic Year",
        "CAP Round"
    ];
    
    const rows = [];
    
    // Add Dream items
    filteredDream.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push([
            "Dream Option (Slightly Risky)",
            item.college_code,
            item.choice_code,
            item.college_name,
            item.branch_name,
            currentCategory,
            item.cutoffPct.toFixed(2),
            item.cutoffRank || "N/A",
            item.stage,
            studentPct.toFixed(2),
            `+${diff}%`,
            currentYear,
            currentRound
        ]);
    });
    
    // Add Match items
    filteredMatch.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push([
            "Realistic Match (Highly Recommended)",
            item.college_code,
            item.choice_code,
            item.college_name,
            item.branch_name,
            currentCategory,
            item.cutoffPct.toFixed(2),
            item.cutoffRank || "N/A",
            item.stage,
            studentPct.toFixed(2),
            `${diff}%`,
            currentYear,
            currentRound
        ]);
    });
    
    // Add Safe items
    filteredSafe.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push([
            "Safe Admission Option (Backup)",
            item.college_code,
            item.choice_code,
            item.college_name,
            item.branch_name,
            currentCategory,
            item.cutoffPct.toFixed(2),
            item.cutoffRank || "N/A",
            item.stage,
            studentPct.toFixed(2),
            `${diff}%`,
            currentYear,
            currentRound
        ]);
    });
    
    const csvContent = convertToCSV(headers, rows);
    const filename = `dse_predicted_colleges_${studentPct}_${currentCategory}_${currentYear}.csv`;
    triggerCSVDownload(filename, csvContent);
}

// Utility function to convert arrays to CSV content
function convertToCSV(headers, rows) {
    const csvContent = [];
    csvContent.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    
    rows.forEach(row => {
        const escapedRow = row.map(value => {
            if (value === null || value === undefined) {
                return '""';
            }
            const stringVal = String(value);
            return `"${stringVal.replace(/"/g, '""')}"`;
        });
        csvContent.push(escapedRow.join(','));
    });
    
    return csvContent.join('\n');
}

// Helper to trigger file download in browser
function triggerCSVDownload(filename, csvData) {
    // Show AI warning popup
    alert("AI Notice & Disclaimer:\n\nAll cutoff predictions, listing data, and analytics exported in this file are generated with the help of AI models using historical CAP round datasets. Actual cutoffs vary year-by-year depending on seat availability and candidate choices.\n\nMake sure to double-check and verify choice codes and cutoff percentages against official CET Cell lists before submitting your final CAP option form!");

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Local Storage & Reconcile helpers
function saveShortlistToStorage() {
    const codes = shortlistedColleges.map(c => c ? c.choice_code : null).filter(Boolean);
    localStorage.setItem('dse_shortlisted_codes', JSON.stringify(codes));
}

function loadShortlistFromStorage() {
    const stored = localStorage.getItem('dse_shortlisted_codes');
    if (stored) {
        try {
            const codes = JSON.parse(stored);
            // Initially pack mock objects, will reconcile when JSON loads
            shortlistedColleges = codes.map(code => ({ choice_code: code, college_name: 'Loading...', branch_name: '' }));
            shortlistBadge.textContent = shortlistedColleges.length;
        } catch (e) {
            console.error("Error reading shortlist from localStorage:", e);
            shortlistedColleges = [];
        }
    }
}

// Map choice codes to complete objects once cutoffData JSON has resolved
function reconcileShortlistObjects() {
    if (shortlistedColleges.length === 0 || cutoffData.length === 0) return;
    
    const reconciled = shortlistedColleges.map(item => {
        const fullObj = cutoffData.find(c => c.choice_code === item.choice_code);
        return fullObj || null;
    }).filter(Boolean);
    
    shortlistedColleges = reconciled;
    renderShortlist();
}

// Check if the current logged-in user has written a review
function hasUserReviewed() {
    if (!currentUser) return false;
    const currentUserId = currentUser._id || currentUser.id;
    if (!currentUserId) return false;
    return loadedReviews.some(r => r.userId && r.userId.toString() === currentUserId.toString());
}

// Update predictor form lock banner text, visibility, and listeners based on login & review state
function updatePredictorLockStatus() {
    const lockMsg = document.getElementById('predictor-lock-msg');
    if (!lockMsg) return;
    
    if (!token || !currentUser) {
        lockMsg.innerHTML = `
            <i data-lucide="lock" style="flex-shrink: 0; color: #ef4444; width: 20px; height: 20px;"></i>
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.4;">
                <strong>Predictor Locked:</strong> You must sign in and submit a student review to unlock the college list.
                <a href="#" id="lock-banner-action-link" style="color: var(--text-link); text-decoration: underline; margin-left: 0.5rem; font-weight: 600;">Sign In / Sign Up &rarr;</a>
            </div>
        `;
        lockMsg.classList.remove('hidden');
        
        const actionLink = document.getElementById('lock-banner-action-link');
        if (actionLink) {
            actionLink.addEventListener('click', (e) => {
                e.preventDefault();
                showAuthModal('login');
            });
        }
        lucide.createIcons();
    } else if (!hasUserReviewed()) {
        lockMsg.innerHTML = `
            <i data-lucide="lock" style="flex-shrink: 0; color: #ef4444; width: 20px; height: 20px;"></i>
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.4;">
                <strong>Predictor Locked:</strong> You must submit a student review to unlock the college list.
                <a href="#reviews-section" id="lock-banner-action-link" style="color: var(--text-link); text-decoration: underline; margin-left: 0.5rem; font-weight: 600;">Write Review Now &rarr;</a>
            </div>
        `;
        lockMsg.classList.remove('hidden');
        lucide.createIcons();
    } else {
        lockMsg.classList.add('hidden');
    }
    updateReviewFormVisibility();
}

// Toggle review form visibility based on login state and review status
function updateReviewFormVisibility() {
    if (!reviewForm || !reviewGuestCta || !reviewAlreadySubmittedMsg) return;

    if (!token || !currentUser) {
        // Guest mode
        reviewForm.classList.add('hidden');
        reviewAlreadySubmittedMsg.classList.add('hidden');
        reviewGuestCta.classList.remove('hidden');
    } else {
        // User logged in
        reviewGuestCta.classList.add('hidden');
        
        if (editingReviewId) {
            // Edit review mode
            reviewForm.classList.remove('hidden');
            reviewAlreadySubmittedMsg.classList.add('hidden');
        } else if (hasUserReviewed()) {
            // Already reviewed mode (don't show form)
            reviewForm.classList.add('hidden');
            reviewAlreadySubmittedMsg.classList.remove('hidden');
        } else {
            // Needs to review
            reviewForm.classList.remove('hidden');
            reviewAlreadySubmittedMsg.classList.add('hidden');
        }
    }
}

// ----------------------------------------------------
// Authentication & Sync Logic
// ----------------------------------------------------

async function checkUserSession() {
    if (!token) {
        updateUIForGuest();
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateUIForUser();
            
            // Override local shortlist with MongoDB cloud shortlist on launch
            if (currentUser.shortlist && currentUser.shortlist.length > 0) {
                shortlistedColleges = currentUser.shortlist.map(code => ({ choice_code: code }));
                saveShortlistToStorage();
            }
        } else {
            // Token expired or invalid
            handleSignout();
        }
    } catch (err) {
        console.error('Session check error:', err);
        updateUIForGuest();
    }
}

function showAuthModal(tab = 'login') {
    authModal.classList.remove('hidden');
    switchAuthTab(tab);
}

function hideAuthModal() {
    authModal.classList.add('hidden');
    loginErrorMsg.classList.add('hidden');
    signupErrorMsg.classList.add('hidden');
    forgotErrorMsg.classList.add('hidden');
    resetErrorMsg.classList.add('hidden');
    loginForm.reset();
    signupForm.reset();
    forgotPasswordForm.reset();
    resetPasswordForm.reset();
    showLoginScreen();
}

function switchAuthTab(tab) {
    // Ensure forgot password states are hidden when clicking Sign In / Sign Up tabs
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
    if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'flex';
    
    if (tab === 'login') {
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

function showForgotScreen() {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.remove('hidden');
    resetPasswordForm.classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'none';
    forgotPasswordForm.reset();
}

function showResetScreen() {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    resetPasswordForm.classList.remove('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'none';
    resetPasswordForm.reset();
}

function showLoginScreen() {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    resetPasswordForm.classList.add('hidden');
    const tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.style.display = 'flex';
    switchAuthTab('login');
}

async function handleForgotPasswordRequest(e) {
    e.preventDefault();
    forgotErrorMsg.classList.add('hidden');
    
    const email = forgotEmailInput.value.trim();
    
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

async function handleResetPassword(e) {
    e.preventDefault();
    resetErrorMsg.classList.add('hidden');
    
    const email = forgotEmailInput.value.trim();
    const otp = resetOtpInput.value.trim();
    const newPassword = resetPasswordInput.value;
    const confirmPass = resetConfirmPasswordInput.value;
    
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

async function handleLogin(e) {
    e.preventDefault();
    loginErrorMsg.classList.add('hidden');
    
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('dse_auth_token', token);
            
            // Sync shortlist: merge local with user's cloud shortlist
            if (data.user.shortlist && data.user.shortlist.length > 0) {
                const localCodes = shortlistedColleges.map(c => c.choice_code);
                const combinedCodes = Array.from(new Set([...localCodes, ...data.user.shortlist]));
                shortlistedColleges = combinedCodes.map(code => ({ choice_code: code }));
                reconcileShortlistObjects();
                saveShortlistToStorage();
                await syncShortlistWithCloud();
            } else if (shortlistedColleges.length > 0) {
                await syncShortlistWithCloud();
            }
            
            updateUIForUser();
            hideAuthModal();
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

async function handleSignup(e) {
    e.preventDefault();
    signupErrorMsg.classList.add('hidden');
    
    const username = signupUsernameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPass = signupConfirmPasswordInput.value;
    
    const adminCodeInput = document.getElementById('signup-admin-code');
    const adminCode = adminCodeInput ? adminCodeInput.value : '';
    
    if (password.length < 6) {
        signupErrorMsg.textContent = 'Password must be at least 6 characters long.';
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
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('dse_auth_token', token);
            
            // If they had items shortlisted as guest, sync them immediately
            if (shortlistedColleges.length > 0) {
                await syncShortlistWithCloud();
            }
            
            updateUIForUser();
            hideAuthModal();
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

function handleSignout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('dse_auth_token');
    localStorage.removeItem('dse_shortlisted_codes');
    shortlistedColleges = [];
    
    updateUIForGuest();
    renderShortlist();
    
    // Hide results and clear prediction input on logout
    if (resultsSection) resultsSection.classList.add('hidden');
    if (form) form.reset();
    
    // Refresh bookmark icons in active query grid
    const query = collegeSearchInput.value;
    renderResults(query);
}

function updateUIForUser() {
    headerSigninBtn.classList.add('hidden');
    headerProfileDropdown.classList.remove('hidden');
    
    // Set initials avatar
    const initials = currentUser.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    userAvatar.textContent = initials || 'U';
    userDisplay.textContent = currentUser.username.split(' ')[0]; // first name
    
    syncShortlistStatus.innerHTML = `
        <i data-lucide="cloud-check" style="color: var(--match-color);"></i>
        <span>Cloud Synced</span>
    `;
    
    // Dynamically inject admin link in profile dropdown if user is admin
    const dropdownList = document.querySelector('.dropdown-menu-list');
    const existingAdminLink = document.getElementById('admin-dashboard-link');
    if (existingAdminLink) existingAdminLink.remove();
    
    if (currentUser.role === 'admin' && dropdownList) {
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
    
    // Show review form for logged in user
    if (reviewForm) reviewForm.classList.remove('hidden');
    if (reviewGuestCta) reviewGuestCta.classList.add('hidden');
    
    lucide.createIcons();
    
    // Re-render reviews list to show Edit/Delete buttons for logged-in user
    if (loadedReviews && loadedReviews.length > 0) {
        renderReviewsList(loadedReviews);
    }
    updatePredictorLockStatus();
}

function updateUIForGuest() {
    headerSigninBtn.classList.remove('hidden');
    headerProfileDropdown.classList.add('hidden');
    
    syncShortlistStatus.innerHTML = `
        <i data-lucide="cloud-lightning" style="color: var(--text-muted);"></i>
        <span>Guest Session</span>
    `;
    
    // Hide review form for guest
    if (reviewForm) reviewForm.classList.add('hidden');
    if (reviewGuestCta) reviewGuestCta.classList.remove('hidden');
    
    lucide.createIcons();
    
    // Re-render reviews list to hide Edit/Delete buttons
    if (loadedReviews && loadedReviews.length > 0) {
        renderReviewsList(loadedReviews);
    }
    updatePredictorLockStatus();
}

async function syncShortlistWithCloud() {
    if (!token) return;
    
    const codes = shortlistedColleges.map(c => c ? c.choice_code : null).filter(Boolean);
    
    try {
        const response = await fetch('/api/user/shortlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ shortlist: codes })
        });
        
        if (response.ok) {
            console.log('Shortlist cloud sync completed.');
        } else {
            console.warn('Could not sync shortlist with database.');
        }
    } catch (err) {
        console.error('Shortlist cloud sync network error:', err);
    }
}

// Map college code and name to region-based university affiliation and autonomy status
function getCollegeAffiliation(code, name) {
    const nameUpper = name.toUpperCase();
    
    // Check Autonomy status
    const isAutonomous = nameUpper.includes("AUTONOMOUS");
    
    let university = "";
    
    // Determine University based on keywords and location
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
    } else if (nameUpper.includes("SOLAPUR UNIVERSITY")) {
        university = "Solapur University";
    } else {
        // Fallback to location-based mapping using city keywords or code prefix
        if (nameUpper.includes("PUNE") || nameUpper.includes("BARAMATI") || nameUpper.includes("PIMPRI") || nameUpper.includes("CHINCHWAD") || nameUpper.includes("ALANDI") || nameUpper.includes("LAVALE")) {
            university = "Savitribai Phule Pune University";
        } else if (nameUpper.includes("MUMBAI") || nameUpper.includes("THANE") || nameUpper.includes("PANVEL") || nameUpper.includes("KOPAR KHAIRANE") || nameUpper.includes("NERUL") || nameUpper.includes("BANDRA") || nameUpper.includes("ANDHERI")) {
            university = "University of Mumbai";
        } else if (nameUpper.includes("NAGPUR") || nameUpper.includes("WARDHA") || nameUpper.includes("RAMTEK")) {
            university = "Rashtrasant Tukadoji Maharaj Nagpur University";
        } else if (nameUpper.includes("AMRAVATI") || nameUpper.includes("SHEGAON") || nameUpper.includes("AKOLA") || nameUpper.includes("YEOLA") || nameUpper.includes("YAVATMAL")) {
            university = "Sant Gadge Baba Amravati University";
        } else if (nameUpper.includes("AURANGABAD") || nameUpper.includes("NANDED") || nameUpper.includes("LATUR") || nameUpper.includes("JALNA")) {
            university = "Dr. Babasaheb Ambedkar Marathwada University";
        } else if (nameUpper.includes("KOLHAPUR") || nameUpper.includes("SANGLI") || nameUpper.includes("SATARA") || nameUpper.includes("KARAD")) {
            university = "Shivaji University, Kolhapur";
        } else if (nameUpper.includes("SOLAPUR") || nameUpper.includes("PANDHARPUR")) {
            university = "Solapur University";
        } else if (nameUpper.includes("NASHIK") || nameUpper.includes("AHMEDNAGAR") || nameUpper.includes("KOPARGAON") || nameUpper.includes("SANGAMNER")) {
            university = "Savitribai Phule Pune University";
        } else {
            // Fallback by code prefix
            const prefix = code.charAt(0);
            if (prefix === '1') {
                university = "Sant Gadge Baba Amravati University";
            } else if (prefix === '2') {
                university = "Dr. Babasaheb Ambedkar Marathwada University";
            } else if (prefix === '3') {
                university = "University of Mumbai";
            } else if (prefix === '4') {
                university = "Rashtrasant Tukadoji Maharaj Nagpur University";
            } else if (prefix === '5') {
                university = "Savitribai Phule Pune University";
            } else if (prefix === '6') {
                university = "Savitribai Phule Pune University";
            }
        }
    }
    
    return {
        university: university,
        isAutonomous: isAutonomous
    };
}

// Function to simulate dynamic counting up for statistics on reload
function animateStatsWriting() {
    const statNums = document.querySelectorAll('.stat-num');
    statNums.forEach((el, index) => {
        const text = el.getAttribute('data-write') || el.textContent || '';
        // Extract number from text (e.g. "2,110+" -> 2110)
        const numVal = parseInt(text.replace(/[^0-9]/g, ''), 10);
        const suffix = text.replace(/[0-9,]/g, '');
        
        if (isNaN(numVal)) return;
        
        el.textContent = '0' + suffix;
        
        // Add a slight delay before starting to count each element
        setTimeout(() => {
            const duration = 1200; // 1.2 seconds counting duration
            const startTime = performance.now();
            
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = Math.floor(easeProgress * numVal);
                
                // Format with comma if >= 1000
                if (currentVal >= 1000) {
                    el.textContent = currentVal.toLocaleString() + suffix;
                } else {
                    el.textContent = currentVal + suffix;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = text; // Set final formatted string (e.g. "2,110+")
                }
            }
            requestAnimationFrame(update);
        }, index * 200); // slight stagger delay
    });
}

// Star Rating input handler setup
function setupStarRatingInteractive() {
    if (!starRatingInput) return;
    const buttons = starRatingInput.querySelectorAll('.star-btn');
    
    // Default active stars styling
    updateStarSelection(5);
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.getAttribute('data-value'), 10);
            selectedRatingInput.value = value;
            updateStarSelection(value);
        });
        
        btn.addEventListener('mouseenter', () => {
            const value = parseInt(btn.getAttribute('data-value'), 10);
            highlightStars(value);
        });
        
        btn.addEventListener('mouseleave', () => {
            const currentValue = parseInt(selectedRatingInput.value, 10) || 5;
            updateStarSelection(currentValue);
        });
    });
}

function updateStarSelection(value) {
    if (!starRatingInput) return;
    const buttons = starRatingInput.querySelectorAll('.star-btn');
    buttons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-value'), 10);
        if (val <= value) {
            btn.classList.add('active');
            btn.style.color = 'hsl(45, 100%, 55%)';
        } else {
            btn.classList.remove('active');
            btn.style.color = 'var(--text-muted)';
        }
    });
}

function highlightStars(value) {
    if (!starRatingInput) return;
    const buttons = starRatingInput.querySelectorAll('.star-btn');
    buttons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-value'), 10);
        if (val <= value) {
            btn.style.color = 'hsl(45, 100%, 55%)';
        } else {
            btn.style.color = 'var(--text-muted)';
        }
    });
}

// Fetch all reviews from the backend API
async function fetchReviews() {
    if (!reviewsLoader) return;
    
    reviewsLoader.classList.remove('hidden');
    reviewsList.classList.add('hidden');
    emptyReviewsMsg.classList.add('hidden');
    
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');
        
        const reviews = await response.json();
        renderReviewsList(reviews);
        updatePredictorLockStatus();
    } catch (err) {
        console.error('Error fetching reviews:', err);
        reviewsLoader.classList.add('hidden');
        emptyReviewsMsg.classList.remove('hidden');
        const emptyMsgP = emptyReviewsMsg.querySelector('p');
        if (emptyMsgP) {
            emptyMsgP.textContent = 'Database is offline or server failed to load reviews.';
        }
    }
}

// Render dynamic review cards list
function renderReviewsList(reviews) {
    if (!reviewsLoader || !reviewsList || !emptyReviewsMsg) return;
    
    reviewsLoader.classList.add('hidden');
    reviewsList.innerHTML = '';
    
    loadedReviews = reviews;
    
    const avgRatingBadge = document.getElementById('average-reviews-rating');
    
    if (!reviews || reviews.length === 0) {
        if (avgRatingBadge) avgRatingBadge.classList.add('hidden');
        emptyReviewsMsg.classList.remove('hidden');
        reviewsList.classList.add('hidden');
        return;
    }
    
    emptyReviewsMsg.classList.add('hidden');
    reviewsList.classList.remove('hidden');
    
    // Calculate Average Rating
    if (avgRatingBadge) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        
        const avgRatingVal = document.getElementById('avg-rating-value');
        const totalReviewsCount = document.getElementById('total-reviews-count');
        const avgRatingStars = document.getElementById('avg-rating-stars');
        
        if (avgRatingVal) avgRatingVal.textContent = avgRating;
        if (totalReviewsCount) totalReviewsCount.textContent = `(${reviews.length} review${reviews.length > 1 ? 's' : ''})`;
        if (avgRatingStars) {
            avgRatingStars.innerHTML = '<i data-lucide="star" style="width: 18px; height: 18px; fill: currentColor; margin-right: 0.1rem;"></i>';
        }
        avgRatingBadge.classList.remove('hidden');
    }
    
    reviews.forEach(review => {
        const initials = review.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        const card = document.createElement('div');
        card.className = 'review-card Card';
        
        // Render stars HTML
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i data-lucide="star" style="${i <= review.rating ? 'color: hsl(45, 100%, 55%); fill: currentColor;' : 'color: var(--text-muted);'}"></i>`;
        }
        
        const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;
        const isOwner = currentUserId && review.userId && (review.userId.toString() === currentUserId.toString());
        
        let actionsHTML = '';
        if (isOwner) {
            actionsHTML = `
                <div class="review-actions" style="margin-top: 0.75rem; display: flex; gap: 0.75rem;">
                    <button class="edit-btn" onclick="startEditReview('${review._id}')" style="background: none; border: none; color: var(--text-link); cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: var(--transition);">
                        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        <span>Edit</span>
                    </button>
                    <button class="delete-btn" disabled style="background: none; border: none; color: var(--text-muted); cursor: not-allowed; opacity: 0.5; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: var(--transition);" title="Review deletion is disabled">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        <span>Delete</span>
                    </button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="review-avatar-col">
                <div class="reviewer-avatar">${initials || 'U'}</div>
            </div>
            <div class="review-content-col">
                <div class="review-meta">
                    <span class="reviewer-name">${review.username}</span>
                    <span class="review-date">${formattedDate}</span>
                </div>
                <div class="review-rating-display">
                    ${starsHTML}
                </div>
                <p class="review-text">${escapeHTML(review.comment)}</p>
                ${actionsHTML}
            </div>
        `;
        
        reviewsList.appendChild(card);
    });
    
    // Re-create lucide icons in dynamic reviews
    lucide.createIcons();
}

// Submit a new student review or update an existing review
async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewErrorMsg) return;
    
    reviewErrorMsg.classList.add('hidden');
    
    const rating = parseInt(selectedRatingInput.value, 10);
    const comment = reviewCommentInput.value.trim();
    
    if (!rating || !comment) {
        reviewErrorMsg.textContent = 'Please select a rating and write a comment.';
        reviewErrorMsg.classList.remove('hidden');
        return;
    }
    
    try {
        const url = editingReviewId ? `/api/reviews/${editingReviewId}` : '/api/reviews';
        const method = editingReviewId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const wasEditing = !!editingReviewId;
            // Clear comment area and reset edit state
            cancelEditReview();
            
            // Reload reviews list
            await fetchReviews();
            
            alert(wasEditing ? 'Your review has been updated successfully.' : 'Thank you! Your review has been submitted successfully.');
        } else {
            reviewErrorMsg.textContent = data.message || 'Submission failed';
            reviewErrorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Review submission error:', err);
        reviewErrorMsg.textContent = 'Server connection error. Please try again.';
        reviewErrorMsg.classList.remove('hidden');
    }
}

// Start editing review
window.startEditReview = function(id) {
    const review = loadedReviews.find(r => r._id === id);
    if (!review) return;
    
    editingReviewId = id;
    reviewCommentInput.value = review.comment;
    selectedRatingInput.value = review.rating;
    updateStarSelection(review.rating);
    
    if (reviewFormTitle) reviewFormTitle.textContent = 'Edit Your Review';
    if (reviewSubmitText) reviewSubmitText.textContent = 'Update Review';
    if (reviewCancelBtn) reviewCancelBtn.classList.remove('hidden');
    
    updateReviewFormVisibility();
    const writePanel = document.querySelector('.write-review-panel');
    if (writePanel) {
        writePanel.scrollIntoView({ behavior: 'smooth' });
    }
};

// Cancel editing review
window.cancelEditReview = function() {
    editingReviewId = null;
    reviewCommentInput.value = '';
    selectedRatingInput.value = 5;
    updateStarSelection(5);
    
    if (reviewFormTitle) reviewFormTitle.textContent = 'Share Your Experience';
    if (reviewSubmitText) reviewSubmitText.textContent = 'Submit Review';
    if (reviewCancelBtn) reviewCancelBtn.classList.add('hidden');
    if (reviewErrorMsg) reviewErrorMsg.classList.add('hidden');
    updateReviewFormVisibility();
};

// Delete review (Disabled)
window.deleteReview = async function(id) {
    alert('Deleting reviews has been disabled.');
    return;
    
    try {
        const response = await fetch(`/api/reviews/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (editingReviewId === id) {
                cancelEditReview();
            }
            await fetchReviews();
            
            // Hide prediction results if they no longer have an active review
            if (!hasUserReviewed()) {
                if (resultsSection) resultsSection.classList.add('hidden');
            }
            
            alert('Review deleted successfully.');
        } else {
            alert(data.message || 'Failed to delete review.');
        }
    } catch (err) {
        console.error('Error deleting review:', err);
        alert('Server connection error. Please try again.');
    }
};

// Simple HTML escaping to prevent XSS in user review comments
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
