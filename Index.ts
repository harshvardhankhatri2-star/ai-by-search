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
        resultsContainer.innerHTML = `<p class="error">Sorry, something went wrong. Please try your search again.</p>`;
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
