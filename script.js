
const API = "https://www.themealdb.com/api/json/v1/1";

const grid = document.getElementById("recipeGrid");
const statusMessage = document.getElementById("statusMessage");
const resultCount = document.getElementById("resultCount");
const resultsTitle = document.getElementById("resultsTitle");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const loadMoreButton = document.getElementById("loadMore");

const modal = document.getElementById("recipeModal");
const modalContent = document.getElementById("modalContent");

let currentMeals = [];
let visibleCount = 8;
let activeCategory = "All";

// Fetch recipes from API
async function fetchMeals(url) {
    statusMessage.textContent = "Finding delicious ideas...";
    grid.innerHTML = "";
    loadMoreButton.hidden = true;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Could not load recipes");
        }

        const data = await response.json();

        currentMeals = data.meals || [];
        visibleCount = 8;

        renderMeals();

    } catch (error) {
        statusMessage.textContent =
            "Oops! Recipes couldn't load. Check your internet connection and try again.";

        resultCount.textContent = "";
    }
}

// Display recipe cards
function renderMeals() {
    grid.innerHTML = "";

    const meals = currentMeals.slice(0, visibleCount);

    resultCount.textContent =
        `${currentMeals.length} recipes found`;

    statusMessage.textContent = currentMeals.length
        ? ""
        : "No recipes found. Try another search or category.";

    meals.forEach((meal, index) => {

        const card = document.createElement("article");

        card.className = "recipe-card";
        card.tabIndex = 0;

        card.innerHTML = `
            <div class="recipe-thumb">

                <img
                    src="${safeUrl(meal.strMealThumb)}"
                    alt="${escapeHtml(meal.strMeal)}"
                    loading="lazy"
                >

                <span class="recipe-tag">
                    ${escapeHtml(meal.strCategory || activeCategory || "Recipe")}
                </span>

            </div>

            <div class="recipe-info">

                <div class="recipe-meta">
                    ${escapeHtml(meal.strArea || "INSPIRATION")}
                    · RECIPE ${index + 1}
                </div>

                <h3>${escapeHtml(meal.strMeal)}</h3>

                <div class="recipe-bottom">
                    <span>Explore ingredients</span>
                    <span>↗</span>
                </div>

            </div>
        `;

        card.addEventListener("click", () => {
            openRecipe(meal.idMeal);
        });

        card.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                openRecipe(meal.idMeal);
            }
        });

        grid.appendChild(card);
    });

    loadMoreButton.hidden =
        currentMeals.length <= visibleCount;
}

// Basic HTML escaping for API text
function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

// Allow HTTPS image and video URLs only
function safeUrl(value = "") {
    try {
        const url = new URL(value);

        return url.protocol === "https:"
            ? url.href
            : "";
    } catch {
        return "";
    }
}

// Search recipes by name
async function searchRecipes(term) {

    const query = term.trim();

    if (!query) {
        resultsTitle.textContent = "Explore recipes";
        await fetchMeals(`${API}/search.php?s=`);
        return;
    }

    activeCategory = "All";

    document.querySelectorAll(".category-chip")
        .forEach(chip => {
            chip.classList.toggle(
                "selected",
                chip.dataset.category === "All"
            );
        });

    resultsTitle.textContent = `Results for "${query}"`;

    await fetchMeals(
        `${API}/search.php?s=${encodeURIComponent(query)}`
    );
}

// Filter recipes by category
async function selectCategory(category) {

    activeCategory = category;

    document.querySelectorAll(".category-chip")
        .forEach(chip => {
            chip.classList.toggle(
                "selected",
                chip.dataset.category === category
            );
        });

    if (category === "All") {
        resultsTitle.textContent = "Explore recipes";

        await fetchMeals(`${API}/search.php?s=`);
        return;
    }

    resultsTitle.textContent = `${category} recipes`;

    await fetchMeals(
        `${API}/filter.php?c=${encodeURIComponent(category)}`
    );
}

// Open recipe details
async function openRecipe(id) {

    modalContent.innerHTML =
        '<p class="status-message">Loading recipe details...</p>';

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    try {
        const response = await fetch(
            `${API}/lookup.php?i=${encodeURIComponent(id)}`
        );

        const data = await response.json();

        const meal = data.meals?.[0];

        if (!meal) {
            throw new Error("Recipe not found");
        }

        // Collect ingredients and measurements
        const ingredients = [];

        for (let i = 1; i <= 20; i++) {

            const ingredient =
                meal[`strIngredient${i}`]?.trim();

            const measure =
                meal[`strMeasure${i}`]?.trim();

            if (ingredient) {
                ingredients.push(`
                    <li>
                        <strong>${escapeHtml(measure)}</strong>
                        ${escapeHtml(ingredient)}
                    </li>
                `);
            }
        }

        modalContent.innerHTML = `

            <img
                class="modal-hero"
                src="${safeUrl(meal.strMealThumb)}"
                alt="${escapeHtml(meal.strMeal)}"
            >

            <p class="eyebrow">
                LET'S MAKE SOMETHING GOOD
            </p>

            <h2>${escapeHtml(meal.strMeal)}</h2>

            <div class="modal-sub">
                ${escapeHtml(meal.strArea || "World")}
                ·
                ${escapeHtml(meal.strCategory || "Recipe")}
            </div>

            <h3>What you'll need</h3>

            <ul class="ingredient-list">
                ${ingredients.join("")}
            </ul>

            <h3>Let's get cooking</h3>

            <p class="instructions">
                ${escapeHtml(meal.strInstructions || "Instructions unavailable.")}
            </p>

            ${
                meal.strYoutube
                ? `
                    <a
                        class="youtube-link"
                        href="${safeUrl(meal.strYoutube)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Watch video tutorial ↗
                    </a>
                `
                : ""
            }

        `;

    } catch (error) {

        modalContent.innerHTML = `
            <p class="status-message">
                Sorry, we could not load this recipe.
                Please try again.
            </p>
        `;
    }
}

// Close recipe modal
function closeModal() {

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

// Search form
searchForm.addEventListener("submit", event => {

    event.preventDefault();

    searchRecipes(searchInput.value);

});

// Quick search buttons
document.querySelectorAll("[data-search]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const query = button.dataset.search;

            searchInput.value = query;

            searchRecipes(query);
        });

    });

// Category buttons
document.querySelectorAll(".category-chip")
    .forEach(button => {

        button.addEventListener("click", () => {

            selectCategory(button.dataset.category);

        });

    });

// Load more recipes
loadMoreButton.addEventListener("click", () => {

    visibleCount += 8;

    renderMeals();

});

// Close modal on backdrop or close button
modal.addEventListener("click", event => {

    if (event.target.matches("[data-close]")) {
        closeModal();
    }

});

// Close modal with Escape key
document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        modal.classList.contains("open")
    ) {
        closeModal();
    }

});

// Load recipes when website opens
fetchMeals(`${API}/search.php?s=`);
