// components/VirtualScrollList.js - Virtual scrolling for performance
import { throttle } from '../utils/helpers.js';

export class VirtualScrollList {
    constructor(container, options = {}) {
        this.container = container;
        this.items = options.items || [];
        this.itemHeight = options.itemHeight || 100;
        this.renderItem = options.renderItem || this.defaultRenderItem;
        this.buffer = options.buffer || 5;

        this.scrollTop = 0;
        this.containerHeight = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';

        // Create viewport
        this.viewport = document.createElement('div');
        this.viewport.style.position = 'relative';
        this.viewport.style.height = `${this.items.length * this.itemHeight}px`;

        // Create content container
        this.content = document.createElement('div');
        this.content.style.position = 'absolute';
        this.content.style.top = '0';
        this.content.style.left = '0';
        this.content.style.right = '0';

        this.viewport.appendChild(this.content);
        this.container.appendChild(this.viewport);

        // Attach scroll listener with throttling
        this.handleScroll = throttle(() => {
            this.onScroll();
        }, 16); // ~60fps

        this.container.addEventListener('scroll', this.handleScroll);

        // Initial render
        this.containerHeight = this.container.clientHeight;
        this.render();

        // Handle resize
        this.resizeObserver = new ResizeObserver(() => {
            this.containerHeight = this.container.clientHeight;
            this.render();
        });
        this.resizeObserver.observe(this.container);
    }

    onScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }

    render() {
        const scrollTop = this.scrollTop;
        const visibleStart = Math.floor(scrollTop / this.itemHeight);
        const visibleEnd = Math.ceil((scrollTop + this.containerHeight) / this.itemHeight);

        // Add buffer
        const renderStart = Math.max(0, visibleStart - this.buffer);
        const renderEnd = Math.min(this.items.length - 1, visibleEnd + this.buffer);

        // Only re-render if the visible range has changed
        if (renderStart !== this.visibleStart || renderEnd !== this.visibleEnd) {
            this.visibleStart = renderStart;
            this.visibleEnd = renderEnd;

            // Clear content
            this.content.innerHTML = '';

            // Render visible items
            for (let i = renderStart; i <= renderEnd; i++) {
                const item = this.items[i];
                const element = this.renderItem(item, i);

                // Position item
                element.style.position = 'absolute';
                element.style.top = `${i * this.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                element.style.height = `${this.itemHeight}px`;

                this.content.appendChild(element);
            }
        }
    }

    defaultRenderItem(item, index) {
        const div = document.createElement('div');
        div.className = 'virtual-scroll-item';
        div.textContent = `Item ${index}`;
        return div;
    }

    updateItems(items) {
        this.items = items;
        this.viewport.style.height = `${this.items.length * this.itemHeight}px`;
        this.render();
    }

    scrollToItem(index) {
        const scrollTop = index * this.itemHeight;
        this.container.scrollTop = scrollTop;
    }


    destroy() {
        this.container.removeEventListener('scroll', this.handleScroll);
        this.resizeObserver.disconnect();
        this.container.innerHTML = '';
    }
}

// Example usage for practice sessions list
export class VirtualSessionsList extends VirtualScrollList {
    constructor(container, sessions, timeUtils) {
        super(container, {
            items: sessions,
            itemHeight: 120,
            renderItem: (session, index) => this.renderSession(session, index),
            buffer: 3
        });
        this.timeUtils = timeUtils;
    }

    renderSession(session, index) {
        const div = document.createElement('div');
        div.className = 'session-card virtual-item';
        div.innerHTML = `
            <div class="session-header">
                <span class="session-date">${new Date(session.date).toLocaleDateString()}</span>
                <span class="session-duration">${this.timeUtils.formatDuration(session.duration)}</span>
            </div>
            <div class="session-details">
                <div class="session-detail">
                    <span class="detail-label">Practice Area</span>
                    <span class="detail-value">${session.practiceArea}</span>
                </div>
                ${session.bpm ? `
                    <div class="session-detail">
                        <span class="detail-label">BPM</span>
                        <span class="detail-value">${session.bpm}</span>
                    </div>
                ` : ''}
            </div>
            ${session.notes ? `<div class="session-notes">${session.notes}</div>` : ''}
        `;
        return div;
    }
}