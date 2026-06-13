// Application State for Admin Dashboard
let adminToken = localStorage.getItem("dse_auth_token") || null;
let currentAdminUser = null;
let activeTab = "overview";

// Data Caches
let statsData = {};
let allUsers = [];
let allReviews = [];
let collegesFeesList = {};
let feesSearchQuery = "";

// DOM Elements
const loader = document.getElementById("admin-loader");
const adminDisplayName = document.getElementById("admin-display-name");
const signoutBtn = document.getElementById("admin-signout-btn");

// Edit Fees Modal DOM Elements
const editModal = document.getElementById("edit-fee-modal");
const editForm = document.getElementById("edit-fee-form");
const editCodeInput = document.getElementById("edit-college-code");
const editNameDisplay = document.getElementById("edit-college-name-display");
const editTuitionInput = document.getElementById("edit-tuition");
const editDevInput = document.getElementById("edit-development");

// Initial Security Check
document.addEventListener("DOMContentLoaded", async () => {
    if (!adminToken) {
        alert("Access Denied: Please sign in first.");
        window.location.href = "/";
        return;
    }
    
    await verifyAdminSession();
    
    // Bind global signout
    signoutBtn.addEventListener("click", handleAdminSignout);
    
    // Bind edit fee form submit
    editForm.addEventListener("submit", handleEditFeeSubmit);
    
    // Bind search input for fees
    const feesSearchInput = document.getElementById("admin-fees-search");
    if (feesSearchInput) {
        feesSearchInput.addEventListener("input", (e) => {
            feesSearchQuery = e.target.value;
            renderFeesTab();
        });
    }
});

// Verify user is logged in as administrator
async function verifyAdminSession() {
    try {
        loader.classList.remove("hidden");
        const response = await fetch("/api/user/profile", {
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        });
        
        if (response.ok) {
            currentAdminUser = await response.json();
            if (currentAdminUser.role !== "admin") {
                alert("Access Denied: Administrator role required.");
                window.location.href = "/";
                return;
            }
            
            // Set displayName
            adminDisplayName.textContent = currentAdminUser.username;
            
            // Load default tab
            await switchTab("overview");
        } else {
            alert("Session expired. Please log in again.");
            handleAdminSignout();
        }
    } catch (err) {
        console.error("Admin session verification error:", err);
        alert("Server connection error during authorization verification.");
        window.location.href = "/";
    } finally {
        loader.classList.add("hidden");
    }
}

// Tab Switching & Data Load Router
async function switchTab(tabName) {
    activeTab = tabName;
    
    // Update active tab sidebar visual states
    const items = document.querySelectorAll(".sidebar-item");
    items.forEach(item => {
        if (item.id === `tab-${tabName}`) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
    
    // Hide all views
    const views = document.querySelectorAll(".admin-view");
    views.forEach(v => v.classList.add("hidden"));
    
    try {
        loader.classList.remove("hidden");
        
        switch (tabName) {
            case "overview":
                await fetchOverviewStats();
                document.getElementById("view-overview").classList.remove("hidden");
                break;
                
            case "reviews":
                await fetchAllReviews();
                document.getElementById("view-reviews").classList.remove("hidden");
                break;
                
            case "users":
                await fetchAllUsers();
                document.getElementById("view-users").classList.remove("hidden");
                break;
                
            case "fees":
                await fetchCollegesFees();
                document.getElementById("view-fees").classList.remove("hidden");
                break;
                
            default:
                break;
        }
    } catch (err) {
        console.error(`Error loading tab ${tabName}:`, err);
    } finally {
        loader.classList.add("hidden");
    }
}

// ----------------------------------------------------
// Tab 1: Overview stats
// ----------------------------------------------------
async function fetchOverviewStats() {
    const response = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${adminToken}` }
    });
    if (!response.ok) throw new Error("Failed to fetch system statistics");
    statsData = await response.json();
    
    // Fill counters
    document.getElementById("stat-total-students").textContent = statsData.totalUsers;
    document.getElementById("stat-total-reviews").textContent = statsData.totalReviews;
    document.getElementById("stat-total-admins").textContent = statsData.totalAdmins;
    
    // Render top shortlisted list
    const tbody = document.getElementById("popular-colleges-body");
    tbody.innerHTML = "";
    
    // Load local fees data to resolve names
    await fetchCollegesFees();
    
    if (statsData.popularColleges.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No colleges shortlisted by students yet.</td></tr>`;
        return;
    }
    
    statsData.popularColleges.forEach((item, idx) => {
        // Find name from colleges database
        let collegeName = "Unknown College Choice Code";
        const matched = Object.values(collegesFeesList).find(c => item._id.startsWith(c.college_code));
        if (matched) collegeName = matched.college_name;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td><code>${item._id}</code></td>
            <td style="color: #fff; font-weight: 500;">${collegeName}</td>
            <td style="text-align: center; font-weight: 700; color: var(--primary-hover);">${item.count} bookmarks</td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// ----------------------------------------------------
// Tab 2: Manage Reviews
// ----------------------------------------------------
async function fetchAllReviews() {
    const response = await fetch("/api/reviews");
    if (!response.ok) throw new Error("Failed to fetch reviews");
    allReviews = await response.json();
    
    const tbody = document.getElementById("admin-reviews-body");
    tbody.innerHTML = "";
    
    if (allReviews.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No reviews submitted yet.</td></tr>`;
        return;
    }
    
    allReviews.forEach(item => {
        const tr = document.createElement("tr");
        const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", { hour: '2-digit', minute: '2-digit' });
        
        // Stars display
        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i data-lucide="star" style="width: 13px; height: 13px; fill: ${i <= item.rating ? 'currentColor' : 'none'}; color: hsl(45, 100%, 55%);"></i>`;
        }
        
        tr.innerHTML = `
            <td><span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span></td>
            <td style="font-weight: 600; color: #fff;">${item.username}</td>
            <td><div style="display: flex; gap: 0.1rem;">${starsHTML}</div></td>
            <td style="color: var(--text-muted); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.comment}">${item.comment}</td>
            <td style="text-align: center;">
                <button onclick="deleteReview('${item._id}')" class="icon-btn" style="color: hsl(0, 85%, 65%); margin: 0 auto;" title="Delete Review">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

async function deleteReview(id) {
    if (!confirm("Are you sure you want to delete this student review?")) return;
    
    try {
        loader.classList.remove("hidden");
        const response = await fetch(`/api/reviews/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            alert("Review successfully deleted.");
            await fetchAllReviews();
        } else {
            const data = await response.json();
            alert(`Error: ${data.message || 'Could not delete review'}`);
        }
    } catch (err) {
        console.error(err);
        alert("Network error deleting review.");
    } finally {
        loader.classList.add("hidden");
    }
}

// ----------------------------------------------------
// Tab 3: Manage Users
// ----------------------------------------------------
async function fetchAllUsers() {
    const response = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${adminToken}` }
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    allUsers = await response.json();
    
    const tbody = document.getElementById("admin-users-body");
    tbody.innerHTML = "";
    
    allUsers.forEach(item => {
        const isSelf = item._id === currentAdminUser.id;
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td><code>${item._id}</code></td>
            <td style="font-weight: 500; color: #fff;">${item.username}</td>
            <td>${item.email}</td>
            <td>
                <span class="concession-badge ${item.role === 'admin' ? 'obc-ews' : 'open'}">${item.role}</span>
            </td>
            <td style="text-align: center;">
                <button onclick="deleteUser('${item._id}')" class="icon-btn" 
                        style="color: ${isSelf ? 'var(--card-border)' : 'hsl(0, 85%, 65%)'}; margin: 0 auto;" 
                        ${isSelf ? 'disabled title="You cannot delete your own account"' : 'title="Delete User"'}>
                    <i data-lucide="user-minus"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user account? All their shortlist syncs will be removed permanently.")) return;
    
    try {
        loader.classList.remove("hidden");
        const response = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            alert("User account deleted successfully.");
            await fetchAllUsers();
        } else {
            const data = await response.json();
            alert(`Error: ${data.message || 'Could not delete user'}`);
        }
    } catch (err) {
        console.error(err);
        alert("Network error deleting user.");
    } finally {
        loader.classList.add("hidden");
    }
}

// ----------------------------------------------------
// Tab 4: Manage Fees
// ----------------------------------------------------
async function fetchCollegesFees() {
    if (Object.keys(collegesFeesList).length > 0) return; // return cache if loaded
    
    const response = await fetch("college_fees_data.json");
    if (!response.ok) throw new Error("Failed to load local fees list");
    collegesFeesList = await response.json();
    
    renderFeesTab();
}

function renderFeesTab() {
    const tbody = document.getElementById("admin-fees-body");
    tbody.innerHTML = "";
    
    const list = Object.values(collegesFeesList);
    const query = feesSearchQuery.trim().toLowerCase();
    
    const filtered = list.filter(item => {
        return item.college_name.toLowerCase().includes(query) || 
               item.college_code.includes(query);
    });
    
    // Sort by code
    filtered.sort((a, b) => a.college_code.localeCompare(b.college_code));
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No colleges found matching search criteria.</td></tr>`;
        return;
    }
    
    filtered.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><code>${item.college_code}</code></td>
            <td style="font-weight: 500; color: #fff;">${item.college_name}</td>
            <td><span style="font-size: 0.85rem; color: var(--text-muted);">${item.type}</span></td>
            <td style="text-align: right; font-family: monospace;">₹${item.tuition_fee.toLocaleString()}</td>
            <td style="text-align: right; font-family: monospace;">₹${item.development_fee.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 600; color: #fff; font-family: monospace;">₹${item.total_fee.toLocaleString()}</td>
            <td style="text-align: center;">
                <button onclick="openEditModal('${item.college_code}')" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; margin: 0 auto; display: flex; align-items: center; gap: 0.3rem;">
                    <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                    <span>Edit</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Open Edit Fees Modal
window.openEditModal = function(code) {
    const item = collegesFeesList[code];
    if (!item) return;
    
    editCodeInput.value = item.college_code;
    editNameDisplay.textContent = item.college_name;
    editTuitionInput.value = item.tuition_fee;
    editDevInput.value = item.development_fee;
    
    editModal.classList.remove("hidden");
    lucide.createIcons();
};

window.closeEditModal = function() {
    editModal.classList.add("hidden");
    editForm.reset();
};

// Handle Edit Fee submission
async function handleEditFeeSubmit(e) {
    e.preventDefault();
    
    const college_code = editCodeInput.value;
    const tuition_fee = parseInt(editTuitionInput.value, 10);
    const development_fee = parseInt(editDevInput.value, 10);
    
    try {
        loader.classList.remove("hidden");
        const response = await fetch("/api/admin/update-fees", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ college_code, tuition_fee, development_fee })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("College base fees updated successfully!");
            // Update local cache
            collegesFeesList[college_code] = data.updated;
            closeEditModal();
            renderFeesTab();
        } else {
            alert(`Error: ${data.message || 'Could not update fees'}`);
        }
    } catch (err) {
        console.error(err);
        alert("Server error committing fee changes.");
    } finally {
        loader.classList.add("hidden");
    }
}

// Signout Handler
function handleAdminSignout() {
    localStorage.removeItem("dse_auth_token");
    localStorage.removeItem("dse_shortlisted_codes");
    window.location.href = "/";
}
