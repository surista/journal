// Environment Badge Component - Shows current environment in non-production
import { 
    shouldShowEnvironmentBadge, 
    getEnvironmentName, 
    getEnvironmentColor,
    currentEnvironment 
} from '../config/environment.js';

export class EnvironmentBadge {
    constructor() {
        this.badge = null;
    }

    init() {
        // Only show badge if configured to do so
        if (!shouldShowEnvironmentBadge()) {
            return;
        }

        this.createBadge();
        this.attachToPage();
    }

    createBadge() {
        this.badge = document.createElement('div');
        this.badge.className = 'environment-badge';
        this.badge.innerHTML = `
            <div class="environment-badge-content">
                <span class="environment-badge-icon">🔧</span>
                <span class="environment-badge-text">${getEnvironmentName()}</span>
            </div>
        `;

        // Apply environment-specific styling
        const color = getEnvironmentColor();
        this.badge.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: ${color};
            color: white;
            padding: 10px 20px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0.9;
        `;

        // Add hover effect
        this.badge.addEventListener('mouseenter', () => {
            this.badge.style.opacity = '1';
            this.badge.style.transform = 'scale(1.05)';
        });

        this.badge.addEventListener('mouseleave', () => {
            this.badge.style.opacity = '0.9';
            this.badge.style.transform = 'scale(1)';
        });

        // Add click handler to show environment details
        this.badge.addEventListener('click', () => {
            this.showEnvironmentInfo();
        });
    }

    attachToPage() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this.badge);
            });
        } else {
            document.body.appendChild(this.badge);
        }
    }

    showEnvironmentInfo() {
        const info = `
Environment: ${getEnvironmentName()}
URL: ${window.location.hostname}
Firebase Project: ${currentEnvironment}

This badge only appears in non-production environments.
        `.trim();

        alert(info);
    }

    destroy() {
        if (this.badge && this.badge.parentNode) {
            this.badge.parentNode.removeChild(this.badge);
        }
        this.badge = null;
    }
}

// Auto-initialize on import
const environmentBadge = new EnvironmentBadge();
environmentBadge.init();

export default environmentBadge;