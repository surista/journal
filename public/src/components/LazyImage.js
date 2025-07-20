// components/LazyImage.js - Lazy loading images with Intersection Observer

export class LazyImage {
    constructor(options = {}) {
        this.rootMargin = options.rootMargin || '50px';
        this.threshold = options.threshold || 0.01;
        this.loadedClass = options.loadedClass || 'lazy-loaded';
        this.loadingClass = options.loadingClass || 'lazy-loading';
        this.errorClass = options.errorClass || 'lazy-error';
        this.images = new Map();

        this.init();
    }

    init() {
        // Create Intersection Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: this.rootMargin,
            threshold: this.threshold
        });
    }

    /**
     * Create a lazy loading image element
     * @param {string} src - Image source URL
     * @param {string} alt - Alt text
     * @param {Object} options - Additional options
     * @returns {HTMLElement}
     */
    create(src, alt = '', options = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = `lazy-image-wrapper ${options.wrapperClass || ''}`;

        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'lazy-image-placeholder';

        // Add loading spinner or skeleton
        if (options.showSpinner) {
            placeholder.innerHTML = `
                <div class="lazy-spinner"></div>
            `;
        }

        // Create image element
        const img = document.createElement('img');
        img.className = `lazy-image ${options.className || ''}`;
        img.setAttribute('data-src', src);
        img.setAttribute('alt', alt);

        // Set placeholder src if provided
        if (options.placeholder) {
            img.src = options.placeholder;
        }

        // Store metadata
        this.images.set(img, {
            src,
            retries: 0,
            maxRetries: options.maxRetries || 3,
            onLoad: options.onLoad,
            onError: options.onError
        });

        wrapper.appendChild(placeholder);
        wrapper.appendChild(img);

        // Start observing
        this.observe(img);

        return wrapper;
    }

    /**
     * Observe an image element for lazy loading
     * @param {HTMLImageElement} img - Image element to observe
     */
    observe(img) {
        if (img.hasAttribute('data-src')) {
            this.observer.observe(img);
        }
    }

    /**
     * Load an image
     * @param {HTMLImageElement} img - Image element to load
     */
    loadImage(img) {
        const metadata = this.images.get(img);
        if (!metadata) return;

        // Stop observing
        this.observer.unobserve(img);

        // Add loading class
        img.classList.add(this.loadingClass);

        // Create new image to test loading
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = metadata.src;
            img.removeAttribute('data-src');
            img.classList.remove(this.loadingClass);
            img.classList.add(this.loadedClass);

            // Hide placeholder
            const wrapper = img.parentElement;
            if (wrapper && wrapper.classList.contains('lazy-image-wrapper')) {
                const placeholder = wrapper.querySelector('.lazy-image-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            }

            // Call onLoad callback if provided
            if (metadata.onLoad) {
                metadata.onLoad(img);
            }

            // Clean up
            this.images.delete(img);
        };

        tempImg.onerror = () => {
            img.classList.remove(this.loadingClass);

            // Retry logic
            if (metadata.retries < metadata.maxRetries) {
                metadata.retries++;
                setTimeout(() => {
                    this.loadImage(img);
                }, 1000 * metadata.retries); // Exponential backoff
            } else {
                img.classList.add(this.errorClass);

                // Show error placeholder
                const wrapper = img.parentElement;
                if (wrapper && wrapper.classList.contains('lazy-image-wrapper')) {
                    const placeholder = wrapper.querySelector('.lazy-image-placeholder');
                    if (placeholder) {
                        placeholder.innerHTML = `
                            <div class="lazy-error-icon">⚠️</div>
                            <div class="lazy-error-text">Failed to load</div>
                        `;
                    }
                }

                // Call onError callback if provided
                if (metadata.onError) {
                    metadata.onError(img);
                }

                // Clean up
                this.images.delete(img);
            }
        };

        // Start loading
        tempImg.src = metadata.src;
    }

    /**
     * Load all images immediately
     */
    loadAll() {
        this.images.forEach((metadata, img) => {
            this.loadImage(img);
        });
    }

    /**
     * Stop observing all images
     */
    disconnect() {
        this.observer.disconnect();
        this.images.clear();
    }
}

// Specialized lazy loader for achievement badges
export class LazyAchievementBadges {
    constructor(container) {
        this.container = container;
        this.lazyLoader = new LazyImage({
            rootMargin: '100px',
            showSpinner: false
        });
    }

    renderBadge(achievement, isEarned) {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `achievement-badge ${isEarned ? 'earned' : 'locked'}`;
        badgeDiv.title = achievement.description;

        // Use emoji icon directly (no lazy loading needed for text)
        const iconDiv = document.createElement('div');
        iconDiv.className = 'achievement-icon';
        iconDiv.textContent = achievement.icon;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'achievement-name';
        nameDiv.textContent = achievement.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'achievement-description';
        descDiv.textContent = achievement.description;

        badgeDiv.appendChild(iconDiv);
        badgeDiv.appendChild(nameDiv);
        badgeDiv.appendChild(descDiv);

        return badgeDiv;
    }

    // For future use with actual badge images
    renderBadgeWithImage(achievement, isEarned) {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `achievement-badge ${isEarned ? 'earned' : 'locked'}`;
        badgeDiv.title = achievement.description;

        // Lazy load badge image
        const imageWrapper = this.lazyLoader.create(
            `/badges/${achievement.id}.png`,
            achievement.name,
            {
                placeholder: '/badges/placeholder.png',
                className: 'badge-image',
                showSpinner: true,
                onLoad: (img) => {
                    // Add animation when loaded
                    img.parentElement.classList.add('badge-loaded');
                }
            }
        );

        const nameDiv = document.createElement('div');
        nameDiv.className = 'achievement-name';
        nameDiv.textContent = achievement.name;

        badgeDiv.appendChild(imageWrapper);
        badgeDiv.appendChild(nameDiv);

        return badgeDiv;
    }

    destroy() {
        this.lazyLoader.disconnect();
    }
}