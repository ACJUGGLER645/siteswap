class Sileo {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.id = 0;
    }

    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'sileo-root';
        document.body.appendChild(this.container);
        
        const style = document.createElement('style');
        style.textContent = `
            #sileo-root {
                position: fixed;
                z-index: 10000;
                top: 24px;
                right: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 380px;
                pointer-events: none;
            }
            .sileo-toast {
                pointer-events: auto;
                position: relative;
                background: #1a1a1a;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 14px;
                box-shadow: 
                    0 4px 24px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                font-family: 'DM Sans', -apple-system, sans-serif;
                transform: translateX(120%) scale(0.9);
                opacity: 0;
                transition: none;
                overflow: hidden;
            }
            .sileo-toast.show {
                animation: sileoIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .sileo-toast.hide {
                animation: sileoOut 0.4s cubic-bezier(0.7, 0, 0.3, 1) forwards;
            }
            @keyframes sileoIn {
                0% { transform: translateX(120%) scale(0.9); opacity: 0; }
                100% { transform: translateX(0) scale(1); opacity: 1; }
            }
            @keyframes sileoOut {
                0% { transform: translateX(0) scale(1); opacity: 1; }
                100% { transform: translateX(120%) scale(0.9); opacity: 0; }
            }
            .sileo-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
                margin-top: 2px;
            }
            .sileo-content {
                flex: 1;
                min-width: 0;
            }
            .sileo-title {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 4px;
                line-height: 1.3;
            }
            .sileo-message {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
                line-height: 1.4;
            }
            .sileo-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                margin: -4px -6px -4px 0;
                opacity: 0.4;
                transition: opacity 0.2s;
                color: #fff;
            }
            .sileo-close:hover {
                opacity: 1;
            }
            .sileo-action {
                margin-top: 10px;
                padding: 8px 14px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .sileo-action:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            /* Types */
            .sileo-toast.success .sileo-bg {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .sileo-toast.error .sileo-bg {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            .sileo-toast.warning .sileo-bg {
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            .sileo-toast.info .sileo-bg {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }
            .sileo-bg {
                position: absolute;
                inset: 0;
                opacity: 0.15;
                transition: opacity 0.3s;
            }
            .sileo-toast:hover .sileo-bg {
                opacity: 0.25;
            }
            /* Promise states */
            .sileo-toast.loading .sileo-spinner {
                display: block;
            }
            .sileo-spinner {
                display: none;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: sileoSpin 0.8s linear infinite;
            }
            @keyframes sileoSpin {
                to { transform: rotate(360deg); }
            }
            /* Progress */
            .sileo-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                border-radius: 0 0 16px 0;
                transition-timing-function: linear;
            }
            .sileo-toast.success .sileo-progress { background: #10b981; }
            .sileo-toast.error .sileo-progress { background: #ef4444; }
            .sileo-toast.warning .sileo-progress { background: #f59e0b; }
            .sileo-toast.info .sileo-progress { background: #3b82f6; }
        `;
        document.head.appendChild(style);
    }

    getIcon(type) {
        const icons = {
            success: `<svg class="sileo-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
            error: `<svg class="sileo-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
            warning: `<svg class="sileo-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
            info: `<svg class="sileo-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
        };
        return icons[type] || icons.info;
    }

    show(options) {
        this.init();
        
        const {
            title = '',
            message = '',
            type = 'info',
            duration = 4000,
            action,
            onAction
        } = typeof options === 'string' ? { message: options } : options;

        const toastId = ++this.id;
        const toast = document.createElement('div');
        toast.className = `sileo-toast ${type} show`;
        toast.dataset.id = toastId;
        
        let actionHtml = '';
        if (action) {
            actionHtml = `<button class="sileo-action">${action}</button>`;
        }
        
        toast.innerHTML = `
            <div class="sileo-bg"></div>
            ${this.getIcon(type)}
            <div class="sileo-content">
                <div class="sileo-title">${title}</div>
                ${message ? `<div class="sileo-message">${message}</div>` : ''}
                ${actionHtml}
            </div>
            <button class="sileo-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="sileo-progress" style="width: 100%"></div>
        `;

        const closeBtn = toast.querySelector('.sileo-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        const actionBtn = toast.querySelector('.sileo-action');
        if (actionBtn && onAction) {
            actionBtn.addEventListener('click', () => {
                onAction();
                this.dismiss(toast);
            });
        }

        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const progress = toast.querySelector('.sileo-progress');
                if (progress) {
                    progress.style.transition = `${duration}ms linear`;
                    progress.style.width = '0%';
                }
            });
        });

        setTimeout(() => this.dismiss(toast), duration);

        return {
            id: toastId,
            dismiss: () => this.dismiss(toast)
        };
    }

    dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        
        const id = parseInt(toast.dataset.id);
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 400);
    }

    success(options) {
        return this.show({ type: 'success', ...options });
    }

    error(options) {
        return this.show({ type: 'error', ...options });
    }

    warning(options) {
        return this.show({ type: 'warning', ...options });
    }

    info(options) {
        return this.show({ type: 'info', ...options });
    }

    async promise(promiseFn, options) {
        const loadingId = this.show({
            type: 'info',
            title: options.loadingTitle || 'Loading...',
            message: options.loadingMessage || 'Please wait',
            duration: 999999,
            action: options.cancelText
        });

        try {
            const result = await promiseFn();
            this.dismiss(document.querySelector(`[data-id="${loadingId.id}"]`));
            
            if (result instanceof Error) {
                this.error({
                    title: options.errorTitle || 'Error',
                    message: result.message
                });
            } else {
                this.success({
                    title: options.successTitle || 'Success!',
                    message: options.successMessage
                });
            }
            return result;
        } catch (err) {
            this.dismiss(document.querySelector(`[data-id="${loadingId.id}"]`));
            this.error({
                title: options.errorTitle || 'Error',
                message: err.message
            });
            throw err;
        }
    }
}

window.sileo = new Sileo();