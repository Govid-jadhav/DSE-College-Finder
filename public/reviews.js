// Dedicated script for reviews.html page
let loadedReviews = [];
let editingReviewId = null;

// DOM Elements
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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup star rating selection triggers
    setupStarRatingInteractive();
    
    // 2. Bind form submissions
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    if (reviewSigninBtn) {
        reviewSigninBtn.addEventListener('click', () => window.showAuthModal('login'));
    }
    if (reviewCancelBtn) {
        reviewCancelBtn.addEventListener('click', () => window.cancelEditReview());
    }

    // 3. Fetch reviews
    fetchReviews();
});

// Shared Auth triggers
window.onAuthInitialized = function() {
    updateReviewFormVisibility();
    if (loadedReviews.length > 0) {
        renderReviewsList(loadedReviews);
    }
};

window.onAuthSuccess = function() {
    updateReviewFormVisibility();
    if (loadedReviews.length > 0) {
        renderReviewsList(loadedReviews);
    }
};

window.onAuthSignout = function() {
    window.cancelEditReview();
    updateReviewFormVisibility();
    if (loadedReviews.length > 0) {
        renderReviewsList(loadedReviews);
    }
};

// Toggle form visibility based on login and review state
function updateReviewFormVisibility() {
    if (!reviewForm || !reviewGuestCta || !reviewAlreadySubmittedMsg) return;

    if (!window.token || !window.currentUser) {
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
            // Already reviewed mode
            reviewForm.classList.add('hidden');
            reviewAlreadySubmittedMsg.classList.remove('hidden');
        } else {
            // Needs to review
            reviewForm.classList.remove('hidden');
            reviewAlreadySubmittedMsg.classList.add('hidden');
        }
    }
}

function hasUserReviewed() {
    if (!window.currentUser) return false;
    const uid = window.currentUser._id || window.currentUser.id;
    if (!uid) return false;
    return loadedReviews.some(r => r.userId && r.userId.toString() === uid.toString());
}

// Fetch reviews
async function fetchReviews() {
    if (!reviewsLoader) return;
    
    reviewsLoader.classList.remove('hidden');
    if (reviewsList) reviewsList.classList.add('hidden');
    if (emptyReviewsMsg) emptyReviewsMsg.classList.add('hidden');
    
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');
        
        const reviews = await response.json();
        renderReviewsList(reviews);
        updateReviewFormVisibility();
    } catch (err) {
        console.error('Error fetching reviews:', err);
        reviewsLoader.classList.add('hidden');
        if (emptyReviewsMsg) {
            emptyReviewsMsg.classList.remove('hidden');
            const emptyMsgP = emptyReviewsMsg.querySelector('p');
            if (emptyMsgP) {
                emptyMsgP.textContent = 'Database is offline or server failed to load reviews.';
            }
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
            avgRatingStars.innerHTML = '<i data-lucide="star" style="width: 20px; height: 20px; fill: currentColor; margin-right: 0.15rem;"></i>';
        }
        avgRatingBadge.classList.remove('hidden');
    }
    
    reviews.forEach(review => {
        const initials = review.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        const card = document.createElement('div');
        card.className = 'review-card Card';
        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i data-lucide="star" style="${i <= review.rating ? 'color: hsl(45, 100%, 55%); fill: currentColor;' : 'color: var(--text-muted);'}"></i>`;
        }
        
        const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const currentUserId = window.currentUser ? (window.currentUser._id || window.currentUser.id) : null;
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
    
    lucide.createIcons();
}

// Submit/Update review
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
                'Authorization': `Bearer ${window.token}`
            },
            body: JSON.stringify({ rating, comment })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const wasEditing = !!editingReviewId;
            window.cancelEditReview();
            
            await fetchReviews();
            alert(wasEditing ? 'Your review has been updated.' : 'Thank you! Your review has been submitted successfully.');
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

// Start Edit Review
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

// Cancel Edit Review
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

// Star rating interactive helpers
function setupStarRatingInteractive() {
    if (!starRatingInput) return;
    const buttons = starRatingInput.querySelectorAll('.star-btn');
    
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

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
