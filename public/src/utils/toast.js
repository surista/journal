// Toast notification utility
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;

    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        info: 'var(--info)',
        warning: 'var(--warning)'
    };

    toast.style.borderLeftWidth = '4px';
    toast.style.borderLeftColor = colors[type] || colors.info;

    // Create inner elements safely
    const toastContent = document.createElement('div');
    toastContent.style.cssText = 'display: flex; align-items: center; gap: 0.75rem;';

    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '1.25rem';
    iconSpan.textContent =
        type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

    const messageSpan = document.createElement('span');
    messageSpan.style.color = 'var(--text-primary)';
    messageSpan.textContent = message;

    toastContent.appendChild(iconSpan);
    toastContent.appendChild(messageSpan);
    toast.appendChild(toastContent);

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles if not present
if (!document.getElementById('toastAnimations')) {
    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
