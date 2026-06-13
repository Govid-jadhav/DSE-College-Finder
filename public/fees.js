// Application State for College Fees Explorer
let collegesData = {};
let selectedType = "ALL";
let searchQuery = "";

// DOM Elements
const searchInput = document.getElementById("college-search-fees");
const typeSelect = document.getElementById("college-type-filter");
const tableBody = document.getElementById("fees-table-body");
const showingCountSpan = document.getElementById("showing-count");
const totalCountSpan = document.getElementById("total-count");
const noResultsMsg = document.getElementById("fees-no-results");
const loader = document.getElementById("fees-loader");

// Initialize application on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Load College Fees data
    await loadFeesData();
    
    // Bind Event Listeners
    searchInput.addEventListener("input", handleSearch);
    typeSelect.addEventListener("change", handleTypeChange);
});

// Load JSON data from file
async function loadFeesData() {
    try {
        loader.classList.remove("hidden");
        const response = await fetch("college_fees_data.json");
        if (!response.ok) throw new Error("Failed to load college fees data");
        collegesData = await response.json();
        
        const collegeCodes = Object.keys(collegesData);
        totalCountSpan.textContent = collegeCodes.length;
        
        filterAndRender();
    } catch (err) {
        console.error("Error loading fees data:", err);
        alert("Error loading college list. Please check your network connection.");
    } finally {
        loader.classList.add("hidden");
    }
}

// Filter and Render tables
function filterAndRender() {
    const list = Object.values(collegesData);
    const query = searchQuery.trim().toLowerCase();
    
    // Filter list
    const filtered = list.filter(item => {
        const matchesSearch = item.college_name.toLowerCase().includes(query) || 
                              item.college_code.includes(query);
                              
        const matchesType = selectedType === "ALL" || item.type === selectedType;
        
        return matchesSearch && matchesType;
    });
    
    // Sort by college code ascending
    filtered.sort((a, b) => a.college_code.localeCompare(b.college_code));
    
    showingCountSpan.textContent = filtered.length;
    
    // Show empty state if no results
    if (filtered.length === 0) {
        tableBody.innerHTML = "";
        noResultsMsg.classList.remove("hidden");
    } else {
        noResultsMsg.classList.add("hidden");
        renderTableRows(filtered);
    }
}

// Render dynamic rows with navigation redirect on click
function renderTableRows(items) {
    tableBody.innerHTML = "";
    
    items.forEach((item, idx) => {
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td class="mobile-hidden"><span style="color: var(--text-muted); font-size: 0.85rem;">#${idx + 1}</span></td>
            <td><code>${item.college_code}</code></td>
            <td style="font-weight: 500; color: #fff;">${item.college_name}</td>
            <td class="mobile-hidden"><span class="concession-badge open" style="font-size: 0.75rem;">${item.type}</span></td>
        `;
        
        row.addEventListener("click", () => {
            // Redirect to the dedicated college fees details page with college code parameter
            window.location.href = `/college-fees-details?code=${item.college_code}`;
        });
        
        tableBody.appendChild(row);
    });
}

// Handlers for Input Changes
function handleSearch(e) {
    searchQuery = e.target.value;
    filterAndRender();
}

function handleTypeChange(e) {
    selectedType = e.target.value;
    filterAndRender();
}
