// Simplified PracticeTab for testing
export class PracticeTab {
    constructor(storageService) {
        this.storageService = storageService;
        console.log('PracticeTab constructor called');
    }

    render(container) {
        container.innerHTML = '<h2>Practice Tab Loaded!</h2>';
    }

    onActivate() {
        console.log('PracticeTab activated');
    }

    destroy() {
        console.log('PracticeTab destroyed');
    }
}