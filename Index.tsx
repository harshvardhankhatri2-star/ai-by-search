/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// DOM Elements
const searchForm = document.getElementById('search-form') as HTMLFormElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchButton = document.querySelector('#search-form button[type="submit"]') as HTMLButtonElement;
const resultsContainer = document.getElementById('results-container') as HTMLDivElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const categoriesContainer = document.getElementById('categories-container') as HTMLDivElement;
const pricingFilter = document.getElementById('pricing-filter') as HTMLSelectElement;
const listView = document.getElementById('list-view') as HTMLDivElement;
const detailView = document.getElementById('detail-view') as HTMLDivElement;

// State
let allResults: any[] = [];

// AdSense Global
declare global {
    interface Window { adsbygoogle: any[]; }
}
window.adsbygoogle = window.adsbygoogle || [];


interface Model {
    name: string;
    description: string;
    longDescription: string;
    primaryFunction: string;
    websiteUrl: string;
    pricingModel: string;
}

// Event Listeners
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = '';
    loader.style.display = 'block';
    
    // Push the banner ad on a new search, with a slight delay to allow rendering.
    setTimeout(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch(error) {
            console.error("AdSense push error:", error);
        }
    }, 0);


    try {
        // Call our new backend API route
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            const errorInfo = await response.json();
            throw new Error(errorInfo.error || `Server error: ${response.statusText}`);
        }

        allResults = await response.json();
        pricingFilter.value = 'all'; // Reset filter on new search
        applyFilters();

    } catch (error) {
        console.error("Error fetching AI models:", error);
        // Display a more specific error message
        resultsContainer.innerHTML = `<p class="error">Sorry, an error occurred: ${error.message}. Please try again.</p>`;
    } finally {
        loader.style.display = 'none';
    }
});

categoriesContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('category-btn')) {
        const category = target.dataset.category;
        if (category) {
            searchInput.value = category;
            searchButton.click();
        }
    }
});

pricingFilter.addEventListener('change', applyFilters);

// Functions
function applyFilters() {
    const filterValue = pricingFilter.value;
    const filteredResults = filterValue === 'all'
        ? allResults
        : allResults.filter(model => model.pricingModel.toLowerCase() === filterValue.toLowerCase());
    displayResults(filteredResults);
}

function displayResults(models: Model[]) {
    resultsContainer.innerHTML = '';
    if (!models || models.length === 0) {
        resultsContainer.innerHTML = `<p>No models found for your criteria. Please try a different search or filter.</p>`;
        return;
    }

    models.forEach((model, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
            <div class="card-header">
                <h3>${model.name}</h3>
                <span class="tag">${model.primaryFunction}</span>
            </div>
            <p>${model.description}</p>
            <span class="pricing-tag">${model.pricingModel}</span>
        `;
        card.addEventListener('click', () => showDetailView(model));
        card.addEventListener('keydown', (e) => {
             if (e.key === 'Enter' || e.key === ' ') showDetailView(model);
        });
        resultsContainer.appendChild(card);
        
        // Inject an ad card after every 4th result
        if ((index + 1) % 4 === 0) {
            const adCard = document.createElement('div');
            adCard.className = 'ad-card';
            adCard.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-format="fluid"
                     data-ad-layout-key="-fb+5w+4e-db+86"
                     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                     data-ad-slot="YOUR_AD_SLOT_ID_2"></ins>
            `;
            resultsContainer.appendChild(adCard);
            // Use a timeout to ensure the ad container is rendered before pushing the ad.
            setTimeout(() => {
                try {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                } catch (error) {
                    console.error("AdSense push error:", error);
                }
            }, 0);
        }
    });
}

function showDetailView(model: Model) {
    // Animate list view out
    listView.classList.add('animate-slide-out-left');
    listView.addEventListener('animationend', () => {
        listView.style.display = 'none';
        listView.classList.remove('animate-slide-out-left');
    }, { once: true });

    // Prepare and animate detail view in
    detailView.innerHTML = `
        <button id="back-button" aria-label="Back to search results">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to results
        </button>
        <div class="detail-content">
            <div class="detail-header">
                <h2>${model.name}</h2>
                <span class="tag">${model.primaryFunction}</span>
                <span class="pricing-tag-detail">${model.pricingModel}</span>
            </div>
            <p class="long-description">${model.longDescription}</p>
            <a href="${model.websiteUrl}" target="_blank" rel="noopener noreferrer" class="website-link">
                Visit Website
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </div>
    `;
    detailView.style.display = 'flex';
    detailView.classList.add('animate-slide-in-right');
    detailView.addEventListener('animationend', () => {
        detailView.classList.remove('animate-slide-in-right');
    }, { once: true });


    document.getElementById('back-button')?.addEventListener('click', showListView);
}

function showListView() {
    // Animate detail view out
    detailView.classList.add('animate-slide-out-right');
    detailView.addEventListener('animationend', () => {
        detailView.style.display = 'none';
        detailView.classList.remove('animate-slide-out-right');
    }, { once: true });

    // Animate list view in
    listView.style.display = 'flex';
    listView.classList.add('animate-slide-in-left');
    listView.addEventListener('animationend', () => {
        listView.classList.remove('animate-slide-in-left');
    }, { once: true });
}

// Fix: Add an empty export to treat this file as a module.
// This is necessary for `declare global` to work correctly and augment the Window type.
export {};
