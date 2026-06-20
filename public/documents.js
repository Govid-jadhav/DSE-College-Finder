// Interactive Documents Checklist Script

const DOCUMENTS_DATABASE = {
    "OPEN": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth, spelling of name, and mathematics scores." },
        { name: "Diploma final semester marksheet (or equivalent B.Sc.)", desc: "Proof of aggregate eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer of registration to engineering college." },
        { name: "Domicile Certificate (or Birth Certificate/School Leaving showing Birthplace in Maharashtra)", desc: "Mandatory to claim Type-A/B Maharashtra state candidacy seats." },
        { name: "Equivalence Certificate (if Diploma from MSBTE-affiliated outside board)", desc: "Ensures course equivalence to standard engineering curricula." }
    ],
    "OBC": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth and secondary credentials." },
        { name: "Diploma final semester marksheet (or equivalent B.Sc.)", desc: "Proof of aggregate eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer of registration." },
        { name: "Domicile Certificate of Maharashtra", desc: "Mandatory to claim Maharashtra state category seats." },
        { name: "Caste Certificate", desc: "Issued by competent authority in Maharashtra State certifying OBC status." },
        { name: "Caste Validity Certificate", desc: "Issued by Scrutiny Committee of Maharashtra verifying caste authenticity." },
        { name: "Non-Creamy Layer (NCL) Certificate", desc: "Must be valid up to March 31, 2026. (Required to claim seat quota & concessions)." },
        { name: "Tahsildar Income Certificate (Family income ≤ ₹8 Lakhs)", desc: "Required to claim OBC scholarship / 50% tuition waiver." }
    ],
    "EWS": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth and credentials." },
        { name: "Diploma final semester marksheet", desc: "Proof of aggregate eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for college transfer." },
        { name: "Domicile Certificate of Maharashtra", desc: "Verifies Maharashtra State Candidacy." },
        { name: "EWS Eligibility Certificate", desc: "Proforma-V / standard EWS certificate issued by competent authority in Maharashtra State." },
        { name: "Tahsildar Income Certificate (Family income ≤ ₹8 Lakhs)", desc: "Confirms family income criteria eligibility." }
    ],
    "SC": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth." },
        { name: "Diploma final semester marksheet", desc: "Proof of eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer of registration." },
        { name: "Domicile Certificate of Maharashtra", desc: "Required to claim State reservation seats." },
        { name: "Caste Certificate (SC)", desc: "Issued by competent authority in Maharashtra State." },
        { name: "Caste Validity Certificate (SC)", desc: "Issued by Scrutiny Committee of Maharashtra State." },
        { name: "Tahsildar Income Certificate", desc: "Required for full scholarship (if income ≤ 2.5L) or Freeship (if income ≤ 8L)." }
    ],
    "ST": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth." },
        { name: "Diploma final semester marksheet", desc: "Proof of eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer." },
        { name: "Domicile Certificate of Maharashtra", desc: "Required to claim State reservation seats." },
        { name: "Caste Certificate (ST)", desc: "Issued by competent authority in Maharashtra State." },
        { name: "Caste Validity Certificate (ST)", desc: "Issued by Scrutiny Committee / Tribal Welfare Dept." },
        { name: "Tahsildar Income Certificate", desc: "Required for full scholarship (if income ≤ 2.5L) or Freeship (if income ≤ 8L)." }
    ],
    "VJNT": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth." },
        { name: "Diploma final semester marksheet", desc: "Proof of eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer." },
        { name: "Domicile Certificate of Maharashtra", desc: "Required to claim State reservation seats." },
        { name: "Caste Certificate (VJ/DT / NT-A/B/C/D)", desc: "Issued by competent authority in Maharashtra State." },
        { name: "Caste Validity Certificate", desc: "Issued by Scrutiny Committee of Maharashtra." },
        { name: "Non-Creamy Layer (NCL) Certificate", desc: "Must be valid up to March 31, 2026. (Required to claim seat quota & concessions)." },
        { name: "Tahsildar Income Certificate (Family income ≤ ₹8 Lakhs)", desc: "Required to claim tuition concessions / Freeships." }
    ],
    "SBC": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies secondary credentials." },
        { name: "Diploma final semester marksheet", desc: "Proof of eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer." },
        { name: "Domicile Certificate of Maharashtra", desc: "Required to claim reservation seats." },
        { name: "Caste Certificate (SBC)", desc: "Issued by competent authority in Maharashtra State." },
        { name: "Caste Validity Certificate (SBC)", desc: "Issued by Scrutiny Committee." },
        { name: "Non-Creamy Layer (NCL) Certificate", desc: "Must be valid up to March 31, 2026. (Required to claim seat quota & concessions)." },
        { name: "Tahsildar Income Certificate (Family income ≤ ₹8 Lakhs)", desc: "Required to claim tuition concessions / Freeships." }
    ],
    "TFWS": [
        { name: "SSC (Class 10) Marksheet", desc: "Verifies date of birth." },
        { name: "Diploma final semester marksheet", desc: "Proof of aggregate eligibility percentage." },
        { name: "School / College Leaving Certificate (TC)", desc: "Required for transfer of registration." },
        { name: "Domicile Certificate of Maharashtra", desc: "Mandatory. TFWS seats are strictly for Maharashtra State Candidates." },
        { name: "Tahsildar Income Certificate showing family income STRICTLY < ₹8 Lakhs", desc: "Mandatory. Proof of family income limit to be eligible for Tuition Fee Waiver scheme." }
    ]
};

let activeCategory = "OPEN";

document.addEventListener("DOMContentLoaded", () => {
    // Bind Tab Click Handlers
    const tabContainer = document.getElementById("category-tabs-container");
    if (tabContainer) {
        tabContainer.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                // Remove active class from old tab
                tabContainer.querySelector("button.active").classList.remove("active");
                // Add to clicked
                btn.classList.add("active");
                
                activeCategory = btn.getAttribute("data-category");
                renderChecklist();
            });
        });
    }

    // Default Render
    renderChecklist();
});

// Render Checklist Items
function renderChecklist() {
    const listContainer = document.getElementById("documents-checklist-container");
    const titleCategory = document.getElementById("checklist-title-category");
    
    if (!listContainer) return;
    
    // Update heading
    if (titleCategory) {
        titleCategory.textContent = activeCategory + " Category";
    }

    const items = DOCUMENTS_DATABASE[activeCategory] || [];
    listContainer.innerHTML = "";

    items.forEach((item, idx) => {
        const itemDiv = document.createElement("div");
        itemDiv.style.display = "flex";
        itemDiv.style.alignItems = "flex-start";
        itemDiv.style.gap = "0.75rem";
        itemDiv.style.padding = "0.75rem";
        itemDiv.style.background = "rgba(255, 255, 255, 0.01)";
        itemDiv.style.borderRadius = "var(--radius-sm)";
        itemDiv.style.border = "1px solid var(--card-border)";
        itemDiv.style.transition = "var(--transition)";
        
        const checkboxId = `doc-check-${idx}`;
        
        itemDiv.innerHTML = `
            <input type="checkbox" id="${checkboxId}" class="doc-checkbox" style="width: 18px; height: 18px; margin-top: 0.15rem; cursor: pointer; accent-color: var(--match-color);">
            <div style="flex: 1;">
                <label for="${checkboxId}" style="font-size: 0.9rem; font-weight: 600; color: #fff; cursor: pointer; display: block; margin-bottom: 0.15rem;">
                    ${item.name}
                </label>
                <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
                    ${item.desc}
                </p>
            </div>
        `;
        
        // Check event listener
        const checkbox = itemDiv.querySelector("input");
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                itemDiv.style.background = "rgba(16, 185, 129, 0.04)";
                itemDiv.style.borderColor = "hsla(160, 75%, 45%, 0.3)";
            } else {
                itemDiv.style.background = "rgba(255, 255, 255, 0.01)";
                itemDiv.style.borderColor = "var(--card-border)";
            }
            calculateReadiness();
        });

        listContainer.appendChild(itemDiv);
    });

    calculateReadiness();
}

// Calculate readiness index percentage
function calculateReadiness() {
    const listContainer = document.getElementById("documents-checklist-container");
    const readinessPct = document.getElementById("readiness-pct");
    const readinessSummary = document.getElementById("readiness-summary");
    
    if (!listContainer || !readinessPct || !readinessSummary) return;

    const checkboxes = listContainer.querySelectorAll("input.doc-checkbox");
    const total = checkboxes.length;
    let checked = 0;
    
    checkboxes.forEach(c => {
        if (c.checked) checked++;
    });

    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    readinessPct.textContent = `${percentage}%`;

    // Change colors based on progress
    if (percentage === 100) {
        readinessPct.style.color = "var(--match-color)";
        readinessSummary.innerHTML = `<strong style="color: var(--match-color)">Ready to upload!</strong> You have prepared all <strong>${checked}/${total}</strong> certificates. Ensure scans are clear.`;
    } else if (percentage >= 50) {
        readinessPct.style.color = "var(--primary-hover)";
        readinessSummary.innerHTML = `<strong>Looking good!</strong> You have checked off <strong>${checked}/${total}</strong>. Get the remaining document templates ready.`;
    } else {
        readinessPct.style.color = "var(--text-muted)";
        readinessSummary.innerHTML = `You have checked off <strong>${checked}/${total}</strong>. Prepare the certificates to claim quota benefits.`;
    }
}
