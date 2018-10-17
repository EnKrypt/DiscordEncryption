//META{"name":"DiscordEncryption","website":"https://github.com/EnKrypt/DiscordEncryption","source":"https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/encryption.plugin.js"}*//

class DiscordEncryption {
    constructor() {
        this.buttonElement = undefined;
        this.timeoutId = undefined;
        this.config = {
            active: false,
            secrets: []
        };

        this.configKey = `${this.getName()}Config`;
    }

    getName() {
        return 'DiscordEncryption';
    }
    getDescription() {
        return 'Configurable end to end encryption for Discord';
    }
    getVersion() {
        return '0.0.1';
    }
    getAuthor() {
        return 'EnKrypt';
    }

    start() {
        BdApi.showToast(`${this.getName()} Started`, { type: 'success' });
    }

    stop() {
        BdApi.showToast(`${this.getName()} Stopped`, { type: 'warn' });
    }

    load() {
        BdApi.showToast(`${this.getName()} Loaded`, { type: 'info' });
        // Load config
        if (localStorage.getItem(this.configKey)) {
            try {
                this.config = JSON.parse(localStorage.getItem(this.configKey));
            } catch (error) {
                BdApi.showToast(
                    `Corrupted config for ${this.getName()} plugin. Your secrets were not saved.`,
                    { type: 'error', timeout: 10000 }
                );
            }
        }
        // Inject CSS
        BdApi.injectCSS(
            'buttonStyle',
            `
            .encryptionButton {
                position: relative;
                cursor: pointer;
                margin: auto;
                padding-left: 2px;
                -webkit-transition: all 280ms ease;
                transition: all 280ms ease;
            }

            .encryptionButton:hover path {
                fill: #fff;
            }

            .encryptionButton.enabled path {
                fill: #43b581;
            }

            .encryptionButton.disabled path {
                fill: #888;
            }

            .encryptionButton.enabled:hover path {
                fill: #1C9C6D;
            }

            .encryptionButton.disabled:hover path {
                fill: #fff;
            }
            `
        );
        BdApi.injectCSS(
            'keyFieldsStyle',
            `
            .key-fields {
                background: #246;
                border-radius: 0.3em;
                position: absolute;
                width: 15em;
                max-height: 15em;
                overflow-y: auto;
                bottom: 2.8em;
                padding: 0.25em;
                transition: 0.3s ease;
                z-index: 101;
            }

            .key-fields.hide {
                bottom: -18em;
                transition: 0.3s ease;
            }

            .key-fields input {
                background: rgba(0,0,0,0.25);
                border-radius: 0.3em;
                border: none;
                outline: none;
                width: 100%;
                color: #f0f0f0;
                padding: 0.3em 0.5em;
                box-sizing: border-box;
                font-size: 1em;
                line-height: 1.5;
                margin-bottom: 0.25em;
            }

            .key-fields-label {
                color: #eee;
                text-align: center;
                padding: 0.25em 0 0.5em 0;
            }
            `
        );
        BdApi.injectCSS(
            'overlayWrapperStyle',
            `
            .overlay-wrapper {
                visibility: visible;
                position: fixed;
                height: 100%;
                width: 100%;
                background: #000;
                opacity: 0.5;
                z-index: 100;
                transition: 0.3s ease;
            }

            .overlay-wrapper.hide {
                opacity: 0;
                visibility: hidden;
                transition: 0.3s ease;
            }
            `
        );
        // Add overlay element
        $('.app').after(`<div class="overlay-wrapper hide"></div>`);
        $('.overlay-wrapper')[0].addEventListener('click', e => {
            this.hideKeyFields();
        });
    }

    observer(changes) {
        if (changes.target.querySelector('.da-channelTextArea')) {
            this.refreshButton();
        }
    }

    // Unload and load encryption button and handlers
    refreshButton() {
        $('.encryptionButton').remove();
        $('.key-fields').remove();

        var keyFields = '';
        if (this.config.secrets && this.config.secrets.length) {
            for (var secret of this.config.secrets) {
                keyFields = `<input type="password" class="key-field" value="${secret}" />` + keyFields;
            }
        }
        $('button.da-attachButton').after(
            `<svg id="encryptionButton" class="encryptionButton" style="width:24px;height:24px;padding-right:8px;" viewBox="0 0 24 24"><path fill d="M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8.9,6C8.9,4.29 10.29,2.9 12,2.9C13.71,2.9 15.1,4.29 15.1,6V8H8.9V6M16,16H13V19H11V16H8V14H11V11H13V14H16V16Z" /></svg>
            <div class="key-fields hide">
                <div class="key-fields-label">Secret Keys</div>
                <input type="password" class="new-key key-field" placeholder="New Key" />
                ${keyFields}
            </div>`
        );

        this.buttonElement = $('.encryptionButton')[0];
        if (this.config.active) {
            this.buttonElement.classList.add('enabled');
        } else {
            this.buttonElement.classList.add('disabled');
        }

        this.buttonElement.addEventListener('click', e => {
            if (this.config.secrets && this.config.secrets.length) {
                this.config.active = !this.config.active;
                this.refreshButton();
            } else {
                this.showKeyFields();
            }
        });

        this.buttonElement.addEventListener('contextmenu', e => {
            this.showKeyFields();
        });

        $('.key-fields')[0].addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        $('.key-fields')[0].addEventListener('keypress', e => {
            var key = e.which || e.keyCode;
            if (key === 13) {
                e.preventDefault();
                e.stopPropagation();
                var secrets = [];
                $('.key-field').each(function(index) {
                    if ($(this).val().trim()) {
                        secrets.push($(this).val().trim());
                    }
                });
                this.config.secrets = secrets.reverse();
                if (this.config.secrets.length == 1 && !this.config.active) {
                    this.config.active = true;
                }
                this.updateConfig();
                this.hideKeyFields();
                BdApi.showToast(`Secret key(s) were updated successfully`, { type: 'success' });
            }
        });
    }

    showKeyFields() {
        this.refreshButton();
        $('.key-fields')[0].classList.remove('hide');
        $('.overlay-wrapper')[0].classList.remove('hide');
        // Focus on new key field
        this.timeoutId = setTimeout(() => {
            $('.new-key')[0].focus();
        }, 300);
    }

    hideKeyFields() {
        clearTimeout(this.timeoutId);
        $('.key-fields')[0].classList.add('hide');
        $('.overlay-wrapper')[0].classList.add('hide');
    }

    // Update the current config state to localStorage
    updateConfig() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }
}
