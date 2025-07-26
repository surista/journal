// Simplified PracticeTab for testing
export class PracticeTab {
    constructor(storageService) {
        this.storageService = storageService;
    }

    render(container) {
        container.innerHTML = '<h2>Practice Tab Loaded!</h2>';
    }

    onActivate() {}

    destroy() {}
}
