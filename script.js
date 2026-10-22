
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

    /* =========================================
       TOAST NOTIFICATIONS
    ========================================= */

    const toast = $("#toast");
    let toastTimeout;

    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("is-visible");

        window.clearTimeout(toastTimeout);
        toastTimeout = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 3500);
    }

    /* =========================================
       FOOTER YEAR
    ========================================= */

    const yearElement = $("#currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    /* =========================================
       MOBILE NAVIGATION
    ========================================= */

    const menuToggle = $("#menuToggle");
    const mobileMenu = $("#mobileMenu");

    function closeMobileMenu() {
        if (!menuToggle || !mobileMenu) return;

        mobileMenu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
    }

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("is-open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });

        $$(".mobile-menu a").forEach((link) => {
            link.addEventListener("click", closeMobileMenu);
        });

        document.addEventListener("click", (event) => {
            if (
                !menuToggle.contains(event.target) &&
                !mobileMenu.contains(event.target)
            ) {
                closeMobileMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMobileMenu();
            }
        });
    }

    /* =========================================
       DESTINATION FILTERS AND SEARCH
    ========================================= */

    const destinationCards = $$(".destination-card");
    const filterButtons = $$(".filter-button");
    const destinationGrid = $("#destinationGrid");
    const emptyState = $("#emptyState");
    const headerSearch = $("#headerSearch");
    const headerQuery = $("#headerQuery");
    const destinationSearch = $("#destinationSearch");
    const destinationQuery = $("#destinationQuery");
    const travelDate = $("#travelDate");
    const travellerCount = $("#travellerCount");

    let activeCategory = "All";
    let activeSearch = "";
    let favoritesOnly = false;

    function updateFilterButtons(category) {
        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === category;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    function applyDestinationFilters() {
        let visibleCount = 0;

        destinationCards.forEach((card) => {
            const category = card.dataset.category || "";
            const name = card.dataset.name || "";
            const title = $("h3", card)?.textContent || "";
            const favoriteButton = $(".favorite-button", card);

            const categoryMatches =
                activeCategory === "All" ||
                category.toLowerCase() === activeCategory.toLowerCase();

            const searchableText = `${name} ${title} ${category}`.toLowerCase();
            const searchMatches =
                !activeSearch ||
                searchableText.includes(activeSearch.toLowerCase());

            const favoriteMatches =
                !favoritesOnly ||
                Boolean(favoriteButton?.classList.contains("is-favorite"));

            const isVisible =
                categoryMatches && searchMatches && favoriteMatches;

            card.hidden = !isVisible;

            if (isVisible) {
                visibleCount++;
            }
        });

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
            emptyState.textContent = favoritesOnly
                ? "You haven't saved any destinations yet."
                : "No destinations match your search. Try another place or category.";
        }

        if (destinationGrid) {
            destinationGrid.setAttribute(
                "aria-label",
                `${visibleCount} destination${visibleCount === 1 ? "" : "s"} found`
            );
        }
    }

    function performSearch(query, options = {}) {
        const cleanedQuery = query.trim();

        activeSearch = cleanedQuery;
        activeCategory = "All";
        favoritesOnly = false;

        updateFilterButtons("All");
        applyDestinationFilters();

        if (options.scroll !== false) {
            $("#destinations")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (cleanedQuery) {
            const matchingCount = destinationCards.filter(
                (card) => !card.hidden
            ).length;

            showToast(
                matchingCount
                    ? `Found ${matchingCount} matching destination${matchingCount === 1 ? "" : "s"}.`
                    : `No destinations found for "${cleanedQuery}". Try Bali, Kyoto, Phuket or Istanbul.`
            );
        } else {
            showToast("Showing all destinations. Let the exploring begin!");
        }
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.filter || "All";
            activeSearch = "";
            favoritesOnly = false;

            if (headerQuery) headerQuery.value = "";
            if (destinationQuery) destinationQuery.value = "";

            updateFilterButtons(activeCategory);
            applyDestinationFilters();
        });
    });

    /* Header search */

    if (headerSearch && headerQuery) {
        headerSearch.addEventListener("submit", (event) => {
            event.preventDefault();

            const query = headerQuery.value.trim();

            if (!query) {
                showToast("Enter a destination to start exploring.");
                headerQuery.focus();
                return;
            }

            if (destinationQuery) {
                destinationQuery.value = query;
            }

            performSearch(query);
        });
    }

    /* Main trip search — only one submit listener */

    if (destinationSearch && destinationQuery) {
        destinationSearch.addEventListener("submit", (event) => {
            event.preventDefault();

            const query = destinationQuery.value.trim();

            if (!query) {
                showToast("Where would you like to go? Enter a destination first.");
                destinationQuery.focus();
                return;
            }

            if (travelDate?.value) {
                const selectedDate = new Date(`${travelDate.value}T00:00:00`);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    showToast("Please choose today or a future travel date.");
                    travelDate.focus();
                    return;
                }
            }

            if (headerQuery) {
                headerQuery.value = query;
            }

            const dateText = travelDate?.value
                ? ` Travel date: ${travelDate.value}.`
                : "";

            const travellerText = travellerCount
                ? ` Travellers: ${travellerCount.value}.`
                : "";

            performSearch(query);

            if (destinationCards.some((card) => !card.hidden)) {
                showToast(
                    `Showing destinations for ${query}.${dateText}${travellerText} Booking is not connected yet.`
                );
            }
        });
    }

    /* =========================================
       EXPERIENCE CATEGORY SHORTCUTS
    ========================================= */

    $$("[data-category]").forEach((element) => {
        if (element.classList.contains("destination-card")) return;

        element.addEventListener("click", () => {
            const category = element.dataset.category;

            if (!category) return;

            activeCategory = category;
            activeSearch = "";
            favoritesOnly = false;

            if (headerQuery) headerQuery.value = "";
            if (destinationQuery) destinationQuery.value = "";

            updateFilterButtons(category);
            applyDestinationFilters();
        });
    });

    $$("[data-category-link]").forEach((link) => {
        link.addEventListener("click", () => {
            const category = link.dataset.categoryLink;
            if (!category) return;

            activeCategory = category;
            activeSearch = "";
            favoritesOnly = false;

            updateFilterButtons(category);
            applyDestinationFilters();
        });
    });

    /* =========================================
       FAVORITE DESTINATIONS
    ========================================= */

    const favoriteButtons = $$(".favorite-button");
    const headerFavorites = $("#headerFavorites");

    function getFavoriteCards() {
        return favoriteButtons
            .filter((button) => button.classList.contains("is-favorite"))
            .map((button) => button.closest(".destination-card"))
            .filter(Boolean);
    }

    function updateFavoriteCount() {
        if (!headerFavorites) return;

        const count = getFavoriteCards().length;

        headerFavorites.textContent = count ? "♥" : "♡";
        headerFavorites.setAttribute(
            "aria-label",
            count
                ? `View ${count} favorite destination${count === 1 ? "" : "s"}`
                : "View favorites"
        );

        headerFavorites.title = count
            ? `${count} saved destination${count === 1 ? "" : "s"}`
            : "View favorites";
    }

    favoriteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const isFavorite = button.classList.toggle("is-favorite");
            const card = button.closest(".destination-card");
            const destinationName = $("h3", card)?.textContent || "Destination";

            button.textContent = isFavorite ? "♥" : "♡";
            button.setAttribute("aria-pressed", String(isFavorite));
            button.setAttribute(
                "aria-label",
                `${isFavorite ? "Remove" : "Add"} ${destinationName} ${isFavorite ? "from" : "to"} favorites`
            );

            updateFavoriteCount();

            showToast(
                isFavorite
                    ? `Added ${destinationName} to your favorites.`
                    : `Removed ${destinationName} from your favorites.`
            );

            if (favoritesOnly) {
                applyDestinationFilters();
            }
        });
    });

    if (headerFavorites) {
        headerFavorites.addEventListener("click", () => {
            const favorites = getFavoriteCards();

            if (favorites.length === 0) {
                showToast("No saved places yet. Tap a heart on a destination you love.");
                return;
            }

            activeCategory = "All";
            activeSearch = "";
            favoritesOnly = true;

            if (headerQuery) headerQuery.value = "";
            if (destinationQuery) destinationQuery.value = "";

            updateFilterButtons("All");
            applyDestinationFilters();

            $("#destinations")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            showToast(
                `Showing your ${favorites.length} saved destination${favorites.length === 1 ? "" : "s"}.`
            );
        });
    }

    /* =========================================
       SHOW ALL DESTINATIONS
    ========================================= */

    const showAllButton = $("#showAllButton");

    if (showAllButton) {
        showAllButton.addEventListener("click", () => {
            activeCategory = "All";
            activeSearch = "";
            favoritesOnly = false;

            if (headerQuery) headerQuery.value = "";
            if (destinationQuery) destinationQuery.value = "";

            updateFilterButtons("All");
            applyDestinationFilters();

            showToast("All destinations are back. Where will you wander?");
        });
    }

    /* =========================================
       TRAVEL DATE VALIDATION
    ========================================= */

    if (travelDate) {
        const today = new Date();

        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        travelDate.min = localToday;
    }

    /* =========================================
       NEWSLETTER FORM
    ========================================= */

    const newsletterForm = $("#newsletterForm");
    const newsletterEmail = $("#newsletterEmail");

    if (newsletterForm && newsletterEmail) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!newsletterEmail.checkValidity()) {
                newsletterEmail.reportValidity();
                return;
            }

            showToast(
                "Thanks for your interest in Wanderly! Newsletter subscriptions need a backend connection to be saved."
            );

            newsletterForm.reset();
        });
    }

    /* =========================================
       SIGN-IN PLACEHOLDER
    ========================================= */

    const signInButton = $("#signInButton");

    if (signInButton) {
        signInButton.addEventListener("click", (event) => {
            event.preventDefault();

            showToast(
                "Welcome to Wanderly! Sign-in will work once authentication is connected."
            );
        });
    }

    /* =========================================
       INITIALIZE
    ========================================= */

    updateFilterButtons("All");
    applyDestinationFilters();
    updateFavoriteCount();

    console.info("Wanderly initialized successfully.");
});
