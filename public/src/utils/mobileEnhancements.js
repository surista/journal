// Mobile Enhancements for Touch Interactions and Gestures

export class MobileEnhancements {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isRefreshing = false;
        this.pullDistance = 0;
        this.pullThreshold = 80;
        this.currentTab = null;
        this.tabOrder = [
            'practice',
            'repertoire',
            'goals',
            'stats',
            'history',
            'calendar',
            'settings'
        ];
        this.listeners = new Map();
    }

    initialize() {
        // Only initialize on touch devices
        if (!this.isTouchDevice()) return;

        this.setupSwipeGestures();
        this.setupPullToRefresh();
        this.enhanceTouchTargets();
        this.preventDoubleTapZoom();
        this.setupOrientationHandling();
    }

    isTouchDevice() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    }

    setupSwipeGestures() {
        const swipeArea = document.querySelector('.main-content-new');
        if (!swipeArea) return;

        // Touch start
        const handleTouchStart = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };

        // Touch move - track the movement
        const handleTouchMove = (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const diffX = this.touchStartX - currentX;
            const diffY = this.touchStartY - currentY;

            // Only handle horizontal swipes if they're more pronounced than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                // Prevent vertical scrolling during horizontal swipe
                if (Math.abs(diffY) < 30) {
                    e.preventDefault();
                }
            }
        };

        // Touch end - detect swipe
        const handleTouchEnd = (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = this.touchStartX - touchEndX;
            const diffY = this.touchStartY - touchEndY;

            // Minimum swipe distance threshold
            const minSwipeDistance = 50;

            // Check if horizontal swipe is more pronounced than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    // Swiped left - go to next tab
                    this.navigateToNextTab();
                } else {
                    // Swiped right - go to previous tab
                    this.navigateToPreviousTab();
                }
            }

            // Reset values
            this.touchStartX = 0;
            this.touchStartY = 0;
        };

        swipeArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        swipeArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        swipeArea.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Store listeners for cleanup
        this.listeners.set('swipe', { handleTouchStart, handleTouchMove, handleTouchEnd });
    }

    setupPullToRefresh() {
        const mainContent = document.querySelector('.main-content-new');
        if (!mainContent) return;

        // Create pull to refresh indicator
        const refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'pull-to-refresh';
        refreshIndicator.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
        document.body.appendChild(refreshIndicator);

        let startY = 0;
        let currentY = 0;

        const handleTouchStart = (e) => {
            if (mainContent.scrollTop === 0) {
                startY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (!startY) return;

            currentY = e.touches[0].clientY;
            this.pullDistance = currentY - startY;

            if (this.pullDistance > 0 && mainContent.scrollTop === 0) {
                e.preventDefault();

                if (this.pullDistance > 10) {
                    refreshIndicator.classList.add('visible');
                    refreshIndicator.style.transform = `translateX(-50%) translateY(${Math.min(this.pullDistance * 0.5, 40)}px)`;
                }

                if (this.pullDistance > this.pullThreshold) {
                    refreshIndicator.classList.add('refreshing');
                }
            }
        };

        const handleTouchEnd = async (e) => {
            if (this.pullDistance > this.pullThreshold && !this.isRefreshing) {
                this.isRefreshing = true;
                refreshIndicator.classList.add('refreshing');

                // Trigger refresh event
                window.dispatchEvent(new CustomEvent('pull-refresh'));

                // Simulate refresh completion
                setTimeout(() => {
                    refreshIndicator.classList.remove('visible', 'refreshing');
                    refreshIndicator.style.transform = 'translateX(-50%)';
                    this.isRefreshing = false;
                }, 1500);
            } else {
                refreshIndicator.classList.remove('visible', 'refreshing');
                refreshIndicator.style.transform = 'translateX(-50%)';
            }

            startY = 0;
            this.pullDistance = 0;
        };

        mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });
        mainContent.addEventListener('touchmove', handleTouchMove, { passive: false });
        mainContent.addEventListener('touchend', handleTouchEnd, { passive: true });

        this.listeners.set('pull-refresh', { handleTouchStart, handleTouchMove, handleTouchEnd });
    }

    enhanceTouchTargets() {
        // Ensure all interactive elements have minimum touch target size
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, .clickable'
        );

        interactiveElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44 || rect.width < 44) {
                element.style.position = 'relative';

                // Create invisible touch target extender
                const extender = document.createElement('div');
                extender.style.position = 'absolute';
                extender.style.left = '50%';
                extender.style.top = '50%';
                extender.style.transform = 'translate(-50%, -50%)';
                extender.style.minWidth = '44px';
                extender.style.minHeight = '44px';
                extender.style.pointerEvents = 'none';

                element.appendChild(extender);
            }
        });
    }

    preventDoubleTapZoom() {
        // Prevent double-tap zoom on iOS
        let lastTouchEnd = 0;

        document.addEventListener(
            'touchend',
            (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            },
            false
        );
    }

    setupOrientationHandling() {
        const handleOrientationChange = () => {
            // Adjust layout based on orientation
            const isLandscape = window.innerWidth > window.innerHeight;
            document.body.classList.toggle('landscape', isLandscape);

            // Dispatch custom event for components to handle
            window.dispatchEvent(
                new CustomEvent('orientation-change', {
                    detail: { isLandscape }
                })
            );
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        // Initial check
        handleOrientationChange();
    }

    navigateToNextTab() {
        const currentIndex = this.tabOrder.indexOf(this.currentTab);
        if (currentIndex < this.tabOrder.length - 1) {
            const nextTab = this.tabOrder[currentIndex + 1];
            this.navigateToTab(nextTab);
        }
    }

    navigateToPreviousTab() {
        const currentIndex = this.tabOrder.indexOf(this.currentTab);
        if (currentIndex > 0) {
            const previousTab = this.tabOrder[currentIndex - 1];
            this.navigateToTab(previousTab);
        }
    }

    navigateToTab(tabName) {
        // Dispatch navigation event
        window.dispatchEvent(
            new CustomEvent('mobile-tab-navigate', {
                detail: { tab: tabName }
            })
        );
    }

    setCurrentTab(tabName) {
        this.currentTab = tabName;
    }

    vibrate(pattern = 10) {
        // Haptic feedback for supported devices
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    destroy() {
        // Clean up all event listeners
        const swipeArea = document.querySelector('.main-content-new');
        if (swipeArea && this.listeners.has('swipe')) {
            const { handleTouchStart, handleTouchMove, handleTouchEnd } =
                this.listeners.get('swipe');
            swipeArea.removeEventListener('touchstart', handleTouchStart);
            swipeArea.removeEventListener('touchmove', handleTouchMove);
            swipeArea.removeEventListener('touchend', handleTouchEnd);
        }

        const mainContent = document.querySelector('.main-content-new');
        if (mainContent && this.listeners.has('pull-refresh')) {
            const { handleTouchStart, handleTouchMove, handleTouchEnd } =
                this.listeners.get('pull-refresh');
            mainContent.removeEventListener('touchstart', handleTouchStart);
            mainContent.removeEventListener('touchmove', handleTouchMove);
            mainContent.removeEventListener('touchend', handleTouchEnd);
        }

        // Remove pull to refresh indicator
        const refreshIndicator = document.querySelector('.pull-to-refresh');
        if (refreshIndicator) {
            refreshIndicator.remove();
        }

        this.listeners.clear();
    }
}

// Export singleton instance
export const mobileEnhancements = new MobileEnhancements();
