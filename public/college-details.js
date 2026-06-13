// Application logic for College Fees Details Page
let collegesData = {};
let selectedCollegeCode = null;

// DOM Elements
const detailCollegeCode = document.getElementById("detail-college-code");
const detailCollegeType = document.getElementById("detail-college-type");
const detailCollegeName = document.getElementById("detail-college-name");
const tableBody = document.getElementById("details-table-body");
const detailsLoader = document.getElementById("details-loader");
const tableCard = document.getElementById("details-table-card");
const rulesCard = document.getElementById("details-rules-card");

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Parse URL parameter ?code=XXXX
    const urlParams = new URLSearchParams(window.location.search);
    selectedCollegeCode = urlParams.get("code");
    
    if (!selectedCollegeCode) {
        // Redirect back if no code provided
        window.location.href = "/fees";
        return;
    }
    
    // Load College Fees data
    await loadCollegeDetails();
});

// Load and populate college fee details
async function loadCollegeDetails() {
    try {
        detailsLoader.classList.remove("hidden");
        const response = await fetch("college_fees_data.json");
        if (!response.ok) throw new Error("Failed to load college fees data");
        collegesData = await response.json();
        
        const college = collegesData[selectedCollegeCode];
        if (!college) {
            alert("Error: Requested college code not found in directory.");
            window.location.href = "/fees";
            return;
        }
        
        // Populate Header Card
        detailCollegeCode.textContent = `CODE: ${college.college_code}`;
        detailCollegeType.textContent = college.type;
        detailCollegeName.textContent = college.college_name;
        
        // Render Comparative Table
        renderCategoryTable(college);
        
        // Show cards, hide loader
        tableCard.classList.remove("hidden");
        rulesCard.classList.remove("hidden");
    } catch (err) {
        console.error("Error loading college details:", err);
        alert("Error loading college details. Please try again.");
        window.location.href = "/fees";
    } finally {
        detailsLoader.classList.add("hidden");
    }
}

// Categories list configuration for comparison
const CATEGORY_SCHEMES = [
    {
        id: "GOPEN",
        name: "Open / General (GOPEN)",
        calcType: "open",
        scheme: "Open Merit Category admissions.",
        criteria: "No concessions. Pays 100% of Tuition & Development fees."
    },
    {
        id: "GOBC",
        name: "OBC / SBC girls (GOBC)",
        calcType: "obc-ews",
        scheme: "Post-Matric Scholarship / Freeship scheme on MahaDBT.",
        criteria: "50% Tuition Fee waiver. Annual family income must be ≤ ₹8 Lakhs."
    },
    {
        id: "EWS",
        name: "EWS / EBC (Open EBC)",
        calcType: "obc-ews",
        scheme: "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti.",
        criteria: "50% Tuition Fee waiver. Open category candidates with family income ≤ ₹8 Lakhs."
    },
    {
        id: "VJNT",
        name: "VJ / NT-A, B, C, D (VJNT)",
        calcType: "waiver",
        scheme: "VJNT Freeship & Scholarship Schemes.",
        criteria: "100% Tuition Fee waiver. Pays 100% Development Fee. Income ≤ ₹8 Lakhs."
    },
    {
        id: "SBC",
        name: "SBC (Special Backward Class)",
        calcType: "waiver",
        scheme: "SBC Freeship & Scholarship Schemes.",
        criteria: "100% Tuition Fee waiver. Pays 100% Development Fee. Income ≤ ₹8 Lakhs."
    },
    {
        id: "TFWS",
        name: "TFWS (Tuition Fee Waiver)",
        calcType: "waiver",
        scheme: "DTE Tuition Fee Waiver Scheme (Supernumerary CAP Quota).",
        criteria: "100% Tuition Fee waiver. Pays 100% Development Fee. Merit-based, income < ₹8 Lakhs."
    },
    {
        id: "SC",
        name: "SC (Scheduled Caste)",
        calcType: "full-waiver",
        scheme: "Govt of India Post-Matric Scholarship & Freeship.",
        criteria: "100% Tuition & Development fee waiver. Pays ₹0 or nominal exam fees only."
    },
    {
        id: "ST",
        name: "ST (Scheduled Tribe)",
        calcType: "full-waiver",
        scheme: "Govt of India Post-Matric Scholarship & Freeship.",
        criteria: "100% Tuition & Development fee waiver. Pays ₹0 or nominal exam fees only."
    }
];

// Recalculate fees and render comparison rows
function renderCategoryTable(college) {
    tableBody.innerHTML = "";
    
    CATEGORY_SCHEMES.forEach(cat => {
        let tuition = college.tuition_fee;
        let development = college.development_fee;
        let badgeText = "Open / Full Fee";
        let badgeClass = "open";
        
        // Concession calculation rules
        if (cat.calcType === "obc-ews") {
            tuition = college.tuition_fee * 0.5;
            badgeText = "50% Tuition Waiver";
            badgeClass = "obc-ews";
        } else if (cat.calcType === "waiver") {
            tuition = 0;
            badgeText = "100% Tuition Waiver";
            badgeClass = "waiver";
        } else if (cat.calcType === "full-waiver") {
            tuition = 0;
            development = 0;
            badgeText = "100% Full Waiver";
            badgeClass = "full-waiver";
        }
        
        tuition = Math.round(tuition);
        development = Math.round(development);
        const total = tuition + development;
        
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td style="font-weight: 600; color: #fff;">${cat.name}</td>
            <td style="text-align: right; font-family: monospace;">₹${tuition.toLocaleString()}</td>
            <td style="text-align: right; font-family: monospace;">₹${development.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 700; color: #fff; font-family: monospace; background-color: rgba(255, 255, 255, 0.01);">₹${total.toLocaleString()}</td>
            <td style="text-align: center;">
                <span class="concession-badge ${badgeClass}">${badgeText}</span>
            </td>
            <td>
                <div style="font-size: 0.85rem; font-weight: 500; color: #fff;">${cat.scheme}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${cat.criteria}</div>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    lucide.createIcons();
}
