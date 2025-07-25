// Image Manager Module - Handles sheet music/image uploads
import { LazyImage } from '../LazyImage.js';

export class ImageManager {
    constructor() {
        this.currentImage = null;
        this.pasteHandler = null;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    }

    initialize() {
        this.setupPasteHandler();
    }

    setupPasteHandler() {
        this.pasteHandler = (e) => {
            // Only handle paste in metronome mode
            if (this.currentMode && this.currentMode !== 'metronome') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    this.handleImageBlob(blob);
                    break;
                }
            }
        };

        document.addEventListener('paste', this.pasteHandler);
    }

    handleImageFile(file) {
        if (!file) return false;

        // Validate file type
        if (!this.validateImageType(file.type)) {
            this.showError('Please upload only JPEG or PNG images');
            return false;
        }

        // Validate file size
        if (!this.validateImageSize(file.size)) {
            this.showError('Image size must be less than 5MB');
            return false;
        }

        // Read the file
        this.readImageFile(file);
        return true;
    }

    handleImageBlob(blob) {
        if (!blob) return false;

        // Validate size
        if (!this.validateImageSize(blob.size)) {
            this.showError('Pasted image is too large. Maximum size is 5MB');
            return false;
        }

        // Validate type
        if (!this.validateImageType(blob.type)) {
            this.showError('Please paste only JPEG or PNG images');
            return false;
        }

        // Read the blob
        this.readImageFile(blob);
        return true;
    }

    validateImageType(type) {
        return this.validTypes.includes(type);
    }

    validateImageSize(size) {
        return size <= this.maxFileSize;
    }

    readImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            if (this.onImageLoadCallback) {
                this.onImageLoadCallback(this.currentImage);
            }
        };
        
        reader.onerror = () => {
            this.showError('Failed to read image file');
        };
        
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.currentImage = null;
        if (this.onImageClearCallback) {
            this.onImageClearCallback();
        }
    }

    async generateThumbnail(imageData, maxWidth = 200, maxHeight = 200) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;
                let width, height;
                
                if (img.width > img.height) {
                    width = Math.min(img.width, maxWidth);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(img.height, maxHeight);
                    width = height * aspectRatio;
                }
                
                // Create canvas for thumbnail
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // Use better quality settings for thumbnail
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw scaled image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with reduced quality to save space
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                resolve(thumbnail);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image for thumbnail generation'));
            };
            
            img.src = imageData;
        });
    }

    getCurrentImage() {
        return this.currentImage;
    }

    showLightbox(imageSrc) {
        if (!imageSrc) return;

        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <img src="${imageSrc}" alt="Sheet music" />
                <button class="lightbox-close">×</button>
                <div class="lightbox-controls">
                    <button class="lightbox-zoom-in">+</button>
                    <button class="lightbox-zoom-out">-</button>
                    <button class="lightbox-rotate">↻</button>
                </div>
            </div>
        `;

        let scale = 1;
        let rotation = 0;
        const img = lightbox.querySelector('img');

        // Close button
        lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
            lightbox.remove();
        });

        // Click overlay to close
        lightbox.querySelector('.lightbox-overlay').addEventListener('click', () => {
            lightbox.remove();
        });

        // Zoom controls
        lightbox.querySelector('.lightbox-zoom-in').addEventListener('click', () => {
            scale = Math.min(scale + 0.2, 3);
            updateTransform();
        });

        lightbox.querySelector('.lightbox-zoom-out').addEventListener('click', () => {
            scale = Math.max(scale - 0.2, 0.5);
            updateTransform();
        });

        // Rotate control
        lightbox.querySelector('.lightbox-rotate').addEventListener('click', () => {
            rotation = (rotation + 90) % 360;
            updateTransform();
        });

        function updateTransform() {
            img.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
        }

        // Keyboard controls
        const handleKeydown = (e) => {
            switch(e.key) {
                case 'Escape':
                    lightbox.remove();
                    break;
                case '+':
                case '=':
                    scale = Math.min(scale + 0.2, 3);
                    updateTransform();
                    break;
                case '-':
                case '_':
                    scale = Math.max(scale - 0.2, 0.5);
                    updateTransform();
                    break;
                case 'r':
                case 'R':
                    rotation = (rotation + 90) % 360;
                    updateTransform();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeydown);
        lightbox.addEventListener('remove', () => {
            document.removeEventListener('keydown', handleKeydown);
        });

        document.body.appendChild(lightbox);
    }

    setCurrentMode(mode) {
        this.currentMode = mode;
    }

    setImageLoadCallback(callback) {
        this.onImageLoadCallback = callback;
    }

    setImageClearCallback(callback) {
        this.onImageClearCallback = callback;
    }

    showError(message) {
        if (window.notificationManager) {
            window.notificationManager.show(message, 'error');
        } else {
            console.error(message);
            alert(message);
        }
    }

    getState() {
        return {
            hasImage: !!this.currentImage,
            imageData: this.currentImage
        };
    }

    setState(state) {
        if (state && state.imageData) {
            this.currentImage = state.imageData;
            if (this.onImageLoadCallback) {
                this.onImageLoadCallback(this.currentImage);
            }
        }
    }

    destroy() {
        if (this.pasteHandler) {
            document.removeEventListener('paste', this.pasteHandler);
            this.pasteHandler = null;
        }
        this.currentImage = null;
        this.onImageLoadCallback = null;
        this.onImageClearCallback = null;
    }
}