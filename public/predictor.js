// Dedicated script for College Predictor Page
let cutoffData = [];
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

// Category Mappings
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

// State for active query output
let lastResults = { dream: [], match: [], safe: [] };

// Initialize Predictor Page
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Hook up shortlist drawer toggles
    if (viewShortlistBtn) viewShortlistBtn.addEventListener('click', toggleShortlistDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', toggleShortlistDrawer);
    if (clearShortlistBtn) clearShortlistBtn.addEventListener('click', clearShortlist);
    if (printShortlistBtn) printShortlistBtn.addEventListener('click', printShortlist);
    if (downloadShortlistBtn) downloadShortlistBtn.addEventListener('click', downloadShortlistCSV);
    if (downloadResultsBtn) downloadResultsBtn.addEventListener('click', downloadResultsCSV);
    
    // 2. Setup form matches and search queries
    if (form) form.addEventListener('submit', handlePredict);
    if (collegeSearchInput) collegeSearchInput.addEventListener('input', handleFilterSearch);

    // 3. Fetch cutoff data JSON
    try {
        loader.classList.remove('hidden');
        const response = await fetch('dse_cutoff_data.json');
        if (!response.ok) throw new Error("Failed to fetch cutoff data");
        cutoffData = await response.json();
        
        populateFilters();
        reconcileShortlistObjects();
    } catch (err) {
        console.error("Initialization error:", err);
        alert("Error loading cutoff data. Please check your network connection.");
    } finally {
        loader.classList.add('hidden');
    }

    // 4. Load reviews from database to verify lock status
    await fetchReviews();

    // 5. Check if redirect requested shortlist open
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open_shortlist') === 'true') {
        setTimeout(() => {
            toggleShortlistDrawer();
        }, 600);
    }
    if (urlParams.get('show_shortlist_info') === 'true') {
        setTimeout(() => {
            showShortlistHelperPopup();
        }, 300);
    }
});

// Shared Auth triggers
window.onAuthInitialized = async function() {
    await fetchReviews();
    reconcileShortlistObjects();
};

window.onAuthSuccess = async function() {
    await fetchReviews();
    reconcileShortlistObjects();
    updatePredictorLockStatus();
};

window.onAuthSignout = function() {
    resultsSection.classList.add('hidden');
    if (form) form.reset();
    renderResults("");
    updatePredictorLockStatus();
};

// Fetch reviews list to check lock requirements
async function fetchReviews() {
    try {
        const response = await fetch('/api/reviews');
        if (response.ok) {
            loadedReviews = await response.json();
            updatePredictorLockStatus();
        }
    } catch (err) {
        console.error('Error fetching reviews:', err);
    }
}

// Verify student review has been posted
function hasUserReviewed() {
    if (!window.currentUser) return false;
    const uid = window.currentUser._id || window.currentUser.id;
    if (!uid) return false;
    return loadedReviews.some(r => r.userId && r.userId.toString() === uid.toString());
}

// Check if review posting is compulsory for the current user
function isReviewCompulsory() {
    if (!window.token || !window.currentUser) return true;
    if (hasUserReviewed()) return false;
    return sessionStorage.getItem('newly_logged_in') === 'true';
}

// Update locking notification display
function updatePredictorLockStatus() {
    const lockMsg = document.getElementById('predictor-lock-msg');
    if (!lockMsg) return;
    
    if (!window.token || !window.currentUser) {
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
                window.showAuthModal('login');
            });
        }
        lucide.createIcons();
    } else if (isReviewCompulsory()) {
        lockMsg.innerHTML = `
            <i data-lucide="lock" style="flex-shrink: 0; color: #ef4444; width: 20px; height: 20px;"></i>
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.4;">
                <strong>Predictor Locked:</strong> You must submit a student review to unlock the college list.
                <a href="/reviews" style="color: var(--text-link); text-decoration: underline; margin-left: 0.5rem; font-weight: 600;">Write Review Now &rarr;</a>
            </div>
        `;
        lockMsg.classList.remove('hidden');
        lucide.createIcons();
    } else {
        lockMsg.classList.add('hidden');
    }
}

// Populate selectors dynamically
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
    
    const sortedCategories = Array.from(categories).sort((a, b) => {
        const priority = ["GOPEN", "LOPEN", "GOBC", "LOBC", "EWS", "GSC", "LSC"];
        const idxA = priority.indexOf(a);
        const idxB = priority.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    categorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
    sortedCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = CATEGORY_MAP[cat] || cat;
        categorySelect.appendChild(option);
    });
    
    branchSelect.innerHTML = '<option value="ALL">All Branches</option>';
    const sortedBranches = Array.from(branches).sort();
    sortedBranches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        branchSelect.appendChild(option);
    });
}

// Predict college probabilities
function handlePredict(e) {
    e.preventDefault();
    
    if (!window.token || !window.currentUser) {
        window.showAuthModal('login');
        return;
    }
    
    if (isReviewCompulsory()) {
        updatePredictorLockStatus();
        window.location.href = "/reviews";
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
    
    setTimeout(() => {
        const dream = [];
        const match = [];
        const safe = [];
        
        cutoffData.forEach(item => {
            if (branch !== "ALL" && item.branch_name !== branch) return;
            
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
                
                if (diff > 0 && diff <= 2.0) {
                    dream.push(collegeResult);
                } else if (diff <= 0 && diff >= -5.0) {
                    match.push(collegeResult);
                } else if (diff < -5.0) {
                    safe.push(collegeResult);
                }
            }
        });
        
        const sortByPct = (a, b) => b.cutoffPct - a.cutoffPct;
        dream.sort(sortByPct);
        match.sort(sortByPct);
        safe.sort(sortByPct);
        
        lastResults = { dream, match, safe };
        
        renderResults();
        
        loader.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// Render Results display lists
function renderResults(searchQuery = "") {
    const query = searchQuery.trim().toLowerCase();
    
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
    
    countDream.textContent = filteredDream.length;
    countMatch.textContent = filteredMatch.length;
    countSafe.textContent = filteredSafe.length;
    
    badgeDream.textContent = filteredDream.length;
    badgeMatch.textContent = filteredMatch.length;
    badgeSafe.textContent = filteredSafe.length;
    
    toggleSectionVisibility(groupDreamSection, filteredDream.length);
    toggleSectionVisibility(groupMatchSection, filteredMatch.length);
    toggleSectionVisibility(groupSafeSection, filteredSafe.length);
    
    const totalCount = filteredDream.length + filteredMatch.length + filteredSafe.length;
    if (totalCount === 0) {
        noResultsMsg.classList.remove('hidden');
    } else {
        noResultsMsg.classList.add('hidden');
    }
    
    renderGrid(gridDream, filteredDream, 'dream');
    renderGrid(gridMatch, filteredMatch, 'match');
    renderGrid(gridSafe, filteredSafe, 'safe');
    
    lucide.createIcons();
}

function toggleSectionVisibility(section, length) {
    if (length === 0) {
        section.classList.add('hidden');
    } else {
        section.classList.remove('hidden');
    }
}

// Render Grid cards
function renderGrid(container, items, safetyClass) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const isShortlisted = window.shortlistedColleges.some(sc => sc.choice_code === item.choice_code);
        
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
        
        const aff = window.getCollegeAffiliation(item.college_code, item.college_name);
        let affiliationHTML = "";
        if (aff.university) {
            affiliationHTML = `
                <div class="college-affiliation">
                    <i data-lucide="building"></i>
                    <span>${aff.university}</span>
                    ${aff.isAutonomous ? `<span class="autonomy-badge">Autonomous</span>` : ''}
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
                            aria-label="${isShortlisted ? 'Remove' : 'Add'}">
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
                
                ${trendPills.length > 0 ? `
                <div class="card-trends">
                    <div class="trends-title">
                        <i data-lucide="trending-up"></i>
                        <span>Cutoff Trend (${item.category})</span>
                    </div>
                    <div class="trends-grid">
                        ${trendPills.map(p => `
                            <span class="trend-badge ${p.isCurrent ? 'highlight' : ''}">
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

function handleFilterSearch(e) {
    renderResults(e.target.value);
}

// Shortlist Drawer
function toggleShortlistDrawer() {
    shortlistDrawer.classList.toggle('open');
    renderShortlist();
}

// Reconcile and save local storage codes to full objects
function reconcileShortlistObjects() {
    if (window.shortlistedColleges.length === 0 || cutoffData.length === 0) return;
    
    const reconciled = window.shortlistedColleges.map(item => {
        const fullObj = cutoffData.find(c => c.choice_code === item.choice_code);
        return fullObj || null;
    }).filter(Boolean);
    
    window.shortlistedColleges = reconciled;
    renderShortlist();
}

window.toggleShortlist = async function(choiceCode) {
    const isAlreadyShortlisted = window.shortlistedColleges.some(sc => sc.choice_code === choiceCode);
    
    if (isAlreadyShortlisted) {
        window.shortlistedColleges = window.shortlistedColleges.filter(sc => sc.choice_code !== choiceCode);
    } else {
        let found = [...lastResults.dream, ...lastResults.match, ...lastResults.safe].find(r => r.choice_code === choiceCode);
        if (!found) found = cutoffData.find(c => c.choice_code === choiceCode);
        if (found) window.shortlistedColleges.push(found);
    }
    
    localStorage.setItem('dse_shortlisted_codes', JSON.stringify(window.shortlistedColleges.map(c => c.choice_code)));
    renderShortlist();
    
    if (window.token && window.currentUser) {
        await window.syncShortlistWithCloud();
    }
    
    renderResults(collegeSearchInput.value);
};

window.removeFromShortlist = function(choiceCode) {
    window.toggleShortlist(choiceCode);
};

function renderShortlist() {
    if (shortlistBadge) shortlistBadge.textContent = window.shortlistedColleges.length;
    
    if (window.shortlistedColleges.length === 0) {
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
    window.shortlistedColleges.forEach((item, idx) => {
        if (!item) return;
        
        const currentCategory = categorySelect.value || "GOPEN";
        const currentYear = yearSelect.value || "2025-26";
        const currentRound = roundSelect.value || "1";
        
        let pct = 0.0;
        if (item.cutoffs && item.cutoffs[currentYear] && item.cutoffs[currentYear][currentRound] && item.cutoffs[currentYear][currentRound][currentCategory]) {
            pct = item.cutoffs[currentYear][currentRound][currentCategory][1];
        }
        
        const itemCard = document.createElement('div');
        itemCard.className = 'shortlisted-card';
        itemCard.innerHTML = `
            <button class="item-remove icon-btn" onclick="removeFromShortlist('${item.choice_code}')">
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

async function clearShortlist() {
    if (window.shortlistedColleges.length === 0) return;
    if (confirm("Are you sure you want to clear your shortlist?")) {
        window.shortlistedColleges = [];
        localStorage.removeItem('dse_shortlisted_codes');
        renderShortlist();
        
        if (window.token && window.currentUser) {
            await window.syncShortlistWithCloud();
        }
        
        renderResults(collegeSearchInput.value);
    }
}

// Print Option Form Prep helper
function printShortlist() {
    if (window.shortlistedColleges.length === 0) {
        alert("Please add at least one college to your shortlist before printing.");
        return;
    }
    
    printTableBody.innerHTML = '';
    window.shortlistedColleges.forEach((item, idx) => {
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
    
    window.print();
}

// Download shortlist CSV helper
function downloadShortlistCSV() {
    if (window.shortlistedColleges.length === 0) {
        alert("Please add at least one college to your shortlist before downloading.");
        return;
    }
    
    const currentCategory = categorySelect.value || "GOPEN";
    const currentYear = yearSelect.value || "2025-26";
    const currentRound = roundSelect.value || "1";
    
    const headers = [
        "Preference", "College Code", "Choice Code", "College Name", "Preferred Branch",
        "Admission Category", "Cutoff Percentage", "Cutoff Rank", "Cutoff Stage", "Academic Year", "CAP Round"
    ];
    
    const rows = window.shortlistedColleges.map((item, idx) => {
        if (!item) return null;
        let pct = "N/A", rank = "N/A", stageStr = "Stage-I";
        if (item.cutoffs && item.cutoffs[currentYear] && item.cutoffs[currentYear][currentRound] && item.cutoffs[currentYear][currentRound][currentCategory]) {
            const [cRank, cPct, cStage] = item.cutoffs[currentYear][currentRound][currentCategory];
            pct = cPct.toFixed(2);
            rank = cRank;
            stageStr = cStage === 1 ? "Stage-I" : cStage === 2 ? "Stage-II" : "Stage-III";
        }
        return [
            idx + 1, item.college_code, item.choice_code, item.college_name, item.branch_name,
            currentCategory, pct, rank, stageStr, currentYear, currentRound
        ];
    }).filter(Boolean);
    
    const csvContent = convertToCSV(headers, rows);
    const filename = `dse_shortlist_${currentCategory}_${currentYear}_R${currentRound}.csv`;
    triggerCSVDownload(filename, csvContent);
}

// Download predicted results CSV helper
function downloadResultsCSV() {
    const query = collegeSearchInput.value.trim().toLowerCase();
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
    
    const totalCount = filteredDream.length + filteredMatch.length + filteredSafe.length;
    if (totalCount === 0) {
        alert("No results to download.");
        return;
    }
    
    const studentPct = parseFloat(pctInput.value);
    const currentCategory = categorySelect.value || "GOPEN";
    const currentYear = yearSelect.value || "2025-26";
    const currentRound = roundSelect.value || "1";
    
    const headers = [
        "Recommendation Group", "College Code", "Choice Code", "College Name", "Branch Name",
        "Admission Category", "Cutoff Percentage", "Cutoff Rank", "Cutoff Stage", "Your Percentage",
        "Difference (Cutoff - Your Pct)", "Academic Year", "CAP Round"
    ];
    
    const rows = [];
    filteredDream.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push(["Dream Option", item.college_code, item.choice_code, item.college_name, item.branch_name, currentCategory, item.cutoffPct.toFixed(2), item.cutoffRank || "N/A", item.stage, studentPct.toFixed(2), `+${diff}%`, currentYear, currentRound]);
    });
    filteredMatch.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push(["Realistic Match", item.college_code, item.choice_code, item.college_name, item.branch_name, currentCategory, item.cutoffPct.toFixed(2), item.cutoffRank || "N/A", item.stage, studentPct.toFixed(2), `${diff}%`, currentYear, currentRound]);
    });
    filteredSafe.forEach(item => {
        const diff = (item.cutoffPct - studentPct).toFixed(2);
        rows.push(["Safe Option", item.college_code, item.choice_code, item.college_name, item.branch_name, currentCategory, item.cutoffPct.toFixed(2), item.cutoffRank || "N/A", item.stage, studentPct.toFixed(2), `${diff}%`, currentYear, currentRound]);
    });
    
    const csvContent = convertToCSV(headers, rows);
    const filename = `dse_predicted_colleges_${studentPct}_${currentCategory}_${currentYear}.csv`;
    triggerCSVDownload(filename, csvContent);
}

function convertToCSV(headers, rows) {
    const csvContent = [];
    csvContent.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    rows.forEach(row => {
        csvContent.push(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });
    return csvContent.join('\n');
}

function triggerCSVDownload(filename, csvData) {
    alert("AI Notice & Disclaimer:\n\nPredictions exported are based on AI processing of historical datasets. Actual current year cutoffs vary. Please double-check with official CET lists before submitting choices.");
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

// Shortlist Helper Guide Popup Modal
function showShortlistHelperPopup() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(6, 9, 22, 0.8)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '3000';
    overlay.style.padding = '1.5rem';
    overlay.className = 'animate-fade-in';
    
    const card = document.createElement('div');
    card.className = 'Card';
    card.style.maxWidth = '440px';
    card.style.width = '100%';
    card.style.padding = '1.5rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '1rem';
    card.style.position = 'relative';
    card.style.textAlign = 'center';
    card.style.border = '1px solid var(--card-border)';
    card.style.boxShadow = 'var(--shadow-lg)';
    
    card.innerHTML = `
        <div style="background: var(--primary); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto; color: white;">
            <i data-lucide="bookmark-check" style="width: 24px; height: 24px;"></i>
        </div>
        <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Shortlist & Export Guide</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.45; text-align: left; margin-bottom: 0.25rem;">
                Thank you for submitting your review! You can shortlist colleges according to your preference and then you can download them in PDF format or Excel format.
            </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left; background: rgba(30, 41, 59, 0.3); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="color: var(--primary-hover); margin-top: 0.15rem;"><i data-lucide="bookmark" style="width: 16px; height: 16px;"></i></div>
                <div>
                    <strong style="color: #fff; font-size: 0.85rem;">Bookmark Colleges</strong>
                    <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.1rem;">Click the bookmark icon on any recommended college card to add it to your shortlist.</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="color: var(--match-color); margin-top: 0.15rem;"><i data-lucide="file-text" style="width: 16px; height: 16px;"></i></div>
                <div>
                    <strong style="color: #fff; font-size: 0.85rem;">Download PDF / Excel Options</strong>
                    <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.1rem;">Use the Shortlist panel at the top-right to download your selections as an Excel (CSV) file or print it as a PDF helper.</p>
                </div>
            </div>
        </div>
        
        <button id="shortlist-popup-close-btn" class="btn btn-primary" style="width: 100%; padding: 0.625rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>Get Started</span>
            <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </button>
    `;
    
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    lucide.createIcons();
    
    // Clean up query param from URL without reloading
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    card.querySelector('#shortlist-popup-close-btn').addEventListener('click', () => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    });
}
