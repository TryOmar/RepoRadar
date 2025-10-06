// Theme Toggle Functionality
document.getElementById("themeToggle").addEventListener("click", function () {
    const body = document.body;
    body.classList.toggle("light-mode");
    const isLightMode = body.classList.contains("light-mode");
    const icon = this.querySelector('i');
    icon.className = isLightMode ? 'fas fa-sun' : 'fas fa-moon';
});

// Main Repository Fetching Functionality
document.getElementById("fetchButton").addEventListener("click", function () {
    const username = document.getElementById("username").value.trim();
  const errorMessageDiv = document.getElementById("error-message");
        const resultsDiv = document.getElementById("results");
    const button = this;
    const buttonText = button.querySelector('span');
    const buttonIcon = button.querySelector('i');
    
    // Clear previous error messages and results
    errorMessageDiv.textContent = "";
    errorMessageDiv.classList.remove("show");
        resultsDiv.innerHTML = "";
    
    if (!username) {
        showError("Please enter a GitHub username.");
        return;
    }
    
    // Show loading state
    button.disabled = true;
    buttonText.textContent = "Analyzing...";
    buttonIcon.className = "fas fa-spinner fa-spin";
    
    // Fetch repositories
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("User not found. Please check the username and try again.");
                } else if (response.status === 403) {
                    throw new Error("API rate limit exceeded. Please try again later.");
                } else {
                    throw new Error("Failed to fetch repositories. Please try again.");
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                showEmptyState();
                return;
            }
            
            // Process repositories
            const repositories = data.map(repo => ({
                ...repo,
                languages: null // Will be fetched separately
            }));

          // Fetch languages for each repository
            const languagePromises = repositories.map(repo => 
          fetch(repo.languages_url)
                    .then(response => response.json())
                    .then(languages => {
                        repo.languages = languages;
                        return repo;
                    })
                    .catch(error => {
                        console.error(`Error fetching languages for ${repo.name}:`, error);
                        repo.languages = {};
                        return repo;
                    })
            );
            
            Promise.all(languagePromises)
                .then(reposWithLanguages => {
                    displayRepositories(reposWithLanguages);
                })
                .catch(error => {
                    console.error("Error processing repositories:", error);
                    showError("Error processing repository data. Please try again.");
                });
        })
        .catch(error => {
            console.error("Error fetching repositories:", error);
            showError(error.message);
        })
        .finally(() => {
            // Reset button state
            button.disabled = false;
            buttonText.textContent = "Analyze Repositories";
            buttonIcon.className = "fas fa-search";
        });
});

function showError(message) {
    const errorMessageDiv = document.getElementById("error-message");
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.add("show");
}

function showEmptyState() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <h3>No repositories found</h3>
            <p>This user doesn't have any public repositories or the username is incorrect.</p>
        </div>
    `;
}

function displayRepositories(repositories) {
    const resultsDiv = document.getElementById("results");
    
    repositories.forEach(repo => {
        const repoCard = createRepositoryCard(repo);
        resultsDiv.appendChild(repoCard);
    });
}

function createRepositoryCard(repo) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    // Get languages data
    const languages = repo.languages || {};
    const languageNames = Object.keys(languages).filter(
        key => key !== "message" && key !== "documentation_url" && key !== repo.language
    );
    
    // Format dates
    const createdDate = new Date(repo.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Format size
    const sizeKB = Math.round(repo.size);
    const sizeMB = (sizeKB / 1024).toFixed(1);
    const sizeText = sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    
    card.innerHTML = `
        <div class="repo-header">
            <div>
                <h2 class="repo-title">
                    <i class="fas fa-folder"></i>
                    ${escapeHtml(repo.name)}
                </h2>
                <p class="repo-description">${repo.description ? escapeHtml(repo.description) : 'No description available'}</p>
            </div>
        </div>
        
        <div class="repo-meta">
            <div class="meta-item">
                <i class="fas fa-code-branch"></i>
                <span>Primary Language:</span>
                <span class="meta-value">${repo.language || 'N/A'}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-weight-hanging"></i>
                <span>Size:</span>
                <span class="meta-value">${sizeText}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-eye"></i>
                <span>Visibility:</span>
                <span class="meta-value">${repo.private ? 'Private' : 'Public'}</span>
            </div>
        </div>
        
        ${repo.homepage ? `
            <div class="meta-item" style="margin-bottom: 1rem;">
                <i class="fas fa-globe"></i>
                <span>Website:</span>
                <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="repo-link">${repo.homepage}</a>
            </div>
        ` : ''}
        
        <div class="meta-item" style="margin-bottom: 1rem;">
            <i class="fas fa-external-link-alt"></i>
            <span>GitHub:</span>
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-link">${repo.html_url}</a>
        </div>
        
        <div class="repo-stats">
            <div class="stat-item stat-stars">
                <i class="fas fa-star"></i>
                <span>${repo.stargazers_count.toLocaleString()} stars</span>
            </div>
            <div class="stat-item stat-forks">
                <i class="fas fa-code-branch"></i>
                <span>${repo.forks_count.toLocaleString()} forks</span>
            </div>
        </div>
        
        ${repo.topics && repo.topics.length > 0 ? `
            <div class="repo-topics">
                ${repo.topics.map(topic => `<span class="topic-tag">${escapeHtml(topic)}</span>`).join('')}
            </div>
        ` : ''}
        
        ${languageNames.length > 0 ? `
            <div class="repo-languages">
                ${repo.language ? `<span class="language-tag language-primary">${escapeHtml(repo.language)} (Primary)</span>` : ''}
                ${languageNames.map(lang => `<span class="language-tag">${escapeHtml(lang)}</span>`).join('')}
            </div>
        ` : repo.language ? `
            <div class="repo-languages">
                <span class="language-tag language-primary">${escapeHtml(repo.language)} (Primary)</span>
            </div>
        ` : ''}
        
        <div class="repo-dates">
            <div class="date-item">
                <i class="fas fa-calendar-plus"></i>
                <span>Created: ${createdDate}</span>
            </div>
            <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Updated: ${updatedDate}</span>
            </div>
        </div>
    `;
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add enter key support for search
document.getElementById("username").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        document.getElementById("fetchButton").click();
    }
});

// Add focus styles and animations
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Mobile-specific improvements
    if (window.innerWidth <= 768) {
        // Prevent zoom on input focus (iOS)
        const searchInput = document.getElementById('username');
        searchInput.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                document.querySelector('meta[name="viewport"]').setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        
        searchInput.addEventListener('blur', function() {
            document.querySelector('meta[name="viewport"]').setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        });
    }
    
    // Touch-friendly interactions
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartY - touchEndY;
        
        if (Math.abs(diff) > swipeThreshold) {
            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    }
    
    // Optimize for mobile performance
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        });
        
        // Observe repo cards when they're added
        const resultsContainer = document.getElementById('results');
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('repo-card')) {
                        observer.observe(node);
                    }
                });
            });
        });
        
        mutationObserver.observe(resultsContainer, { childList: true });
    }
    
    // Add loading animation for better UX
    const style = document.createElement('style');
    style.textContent = `
        .repo-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
            transform: translateY(20px);
            animation-play-state: paused;
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .repo-card:nth-child(1) { animation-delay: 0.1s; }
        .repo-card:nth-child(2) { animation-delay: 0.2s; }
        .repo-card:nth-child(3) { animation-delay: 0.3s; }
        .repo-card:nth-child(4) { animation-delay: 0.4s; }
        .repo-card:nth-child(5) { animation-delay: 0.5s; }
        
        /* Mobile-specific animations */
        @media (max-width: 768px) {
            .repo-card {
                animation-duration: 0.4s;
            }
            
            .search-container {
                animation: slideInDown 0.3s ease;
            }
            
            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
            .repo-card,
            .search-container {
                animation: none;
            }
        }
    `;
    document.head.appendChild(style);
});