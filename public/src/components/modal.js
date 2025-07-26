// Centralized Modal Component
import { notificationManager } from '../services/notificationManager.js';

export class Modal {
    constructor() {
        this.activeModals = new Map();
        this.zIndex = 10000;
    }

    create(options = {}) {
        const {
            id = `modal-${Date.now()}`,
            title = '',
            content = '',
            footer = '',
            className = '',
            closeable = true,
            onClose = null,
            width = '500px',
            maxWidth = '90vw'
        } = options;

        // Remove existing modal with same ID
        if (this.activeModals.has(id)) {
            this.close(id);
        }

        // Create modal elements
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = this.zIndex++;

        const modal = document.createElement('div');
        modal.className = `modal ${className}`;
        modal.id = id;
        modal.style.width = width;
        modal.style.maxWidth = maxWidth;

        // Modal structure - build safely
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalTitle.textContent = title;
        modalHeader.appendChild(modalTitle);

        if (closeable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '&times;'; // Safe - hardcoded entity
            modalHeader.appendChild(closeBtn);
        }

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        // If content is HTML string, use innerHTML (caller's responsibility to sanitize)
        // If content is plain text, use textContent
        if (typeof content === 'string' && content.includes('<')) {
            modalBody.innerHTML = content; // Preserve for backwards compatibility
        } else {
            modalBody.textContent = content;
        }

        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);

        if (footer) {
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            // Footer often contains buttons, so preserve innerHTML
            modalFooter.innerHTML = footer;
            modal.appendChild(modalFooter);
        }

        // Add to overlay
        overlay.appendChild(modal);

        // Event handlers
        if (closeable) {
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.close(id));

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(id);
                }
            });

            // Close on Escape key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(id);
                }
            };
            document.addEventListener('keydown', escHandler);
            modal._escHandler = escHandler;
        }

        // Store modal info
        this.activeModals.set(id, {
            overlay,
            modal,
            onClose,
            escHandler: modal._escHandler
        });

        // Add to DOM
        document.body.appendChild(overlay);

        // Trigger reflow and add active class for animation
        overlay.offsetHeight;
        overlay.classList.add('modal-overlay-active');
        modal.classList.add('modal-active');

        return {
            id,
            modal,
            overlay,
            close: () => this.close(id),
            update: (newContent) => this.update(id, newContent)
        };
    }

    update(id, updates = {}) {
        const modalInfo = this.activeModals.get(id);
        if (!modalInfo) return;

        const { modal } = modalInfo;

        if (updates.title !== undefined) {
            const titleEl = modal.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = updates.title;
        }

        if (updates.content !== undefined) {
            const bodyEl = modal.querySelector('.modal-body');
            if (bodyEl) bodyEl.innerHTML = updates.content;
        }

        if (updates.footer !== undefined) {
            const footerEl = modal.querySelector('.modal-footer');
            if (footerEl) {
                footerEl.innerHTML = updates.footer;
            } else if (updates.footer) {
                const newFooter = document.createElement('div');
                newFooter.className = 'modal-footer';
                newFooter.innerHTML = updates.footer;
                modal.appendChild(newFooter);
            }
        }
    }

    close(id) {
        const modalInfo = this.activeModals.get(id);
        if (!modalInfo) return;

        const { overlay, modal, onClose, escHandler } = modalInfo;

        // Remove active classes for animation
        overlay.classList.remove('modal-overlay-active');
        modal.classList.remove('modal-active');

        // Remove event listeners
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
        }

        // Call onClose callback
        if (typeof onClose === 'function') {
            onClose();
        }

        // Remove from DOM after animation
        setTimeout(() => {
            overlay.remove();
            this.activeModals.delete(id);
        }, 300);
    }

    closeAll() {
        for (const id of this.activeModals.keys()) {
            this.close(id);
        }
    }

    // Helper methods for common modal types
    alert(message, title = 'Alert') {
        return this.create({
            title,
            content: `<p>${message}</p>`,
            footer: '<button class="btn btn-primary modal-ok">OK</button>',
            className: 'modal-alert',
            onClose: null
        });
    }

    confirm(message, title = 'Confirm', onConfirm = null, onCancel = null) {
        const modalInstance = this.create({
            title,
            content: `<p>${message}</p>`,
            footer: `
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Confirm</button>
            `,
            className: 'modal-confirm',
            closeable: false
        });

        const { modal, close } = modalInstance;

        modal.querySelector('.modal-cancel')?.addEventListener('click', () => {
            if (typeof onCancel === 'function') onCancel();
            close();
        });

        modal.querySelector('.modal-confirm')?.addEventListener('click', () => {
            if (typeof onConfirm === 'function') onConfirm();
            close();
        });

        modal.querySelector('.modal-ok')?.addEventListener('click', close);

        return modalInstance;
    }

    prompt(message, title = 'Input', defaultValue = '', onSubmit = null) {
        const inputId = `modal-input-${Date.now()}`;

        const modalInstance = this.create({
            title,
            content: `
                <p>${message}</p>
                <input type="text" id="${inputId}" class="modal-input" value="${defaultValue}" />
            `,
            footer: `
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-submit">Submit</button>
            `,
            className: 'modal-prompt',
            closeable: false
        });

        const { modal, close } = modalInstance;
        const input = modal.querySelector(`#${inputId}`);

        // Focus input
        input?.focus();
        input?.select();

        const submit = () => {
            const value = input?.value || '';
            if (typeof onSubmit === 'function') onSubmit(value);
            close();
        };

        // Handle Enter key
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
        });

        modal.querySelector('.modal-cancel')?.addEventListener('click', close);
        modal.querySelector('.modal-submit')?.addEventListener('click', submit);

        return modalInstance;
    }
}

// Create singleton instance
export const modal = new Modal();

// Export for backward compatibility
export default modal;
