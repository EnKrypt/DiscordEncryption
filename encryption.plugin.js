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
                width: calc(100% - 0.25em);
                color: #f0f0f0;
                padding: 0.3em 0.5em;
                box-sizing: border-box;
                font-size: 1em;
                line-height: 1.5;
                margin-bottom: 0.25em;
            }

            .key-fields :nth-last-child(2) {
                background: rgba(0,150,0,0.25);
            }

            .key-fields svg {
                margin-left: -2em;
                margin-bottom: -0.4em;
                cursor: pointer;
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

        var eye =
        'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z';
        var noeye =
        'M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z';

        var keyFields = '';
        if (this.config.secrets && this.config.secrets.length) {
            for (var secret of this.config.secrets) {
                keyFields =
                    `<input type="password" class="key-field" value="${secret}" />
                    <svg style="width:20px;height:20px" viewBox="0 0 24 24">
                        <path fill="#ddd" d="${eye}" />
                    </svg>` + keyFields;
            }
        }

        $('button.da-attachButton').after(
            `<svg id="encryptionButton" class="encryptionButton" style="width:24px;height:24px;padding-right:8px;" viewBox="0 0 24 24"><path fill d="M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8.9,6C8.9,4.29 10.29,2.9 12,2.9C13.71,2.9 15.1,4.29 15.1,6V8H8.9V6M16,16H13V19H11V16H8V14H11V11H13V14H16V16Z" /></svg>
            <div class="key-fields hide">
                <div class="key-fields-label">Secret Keys</div>
                <input type="password" class="new-key key-field" placeholder="New Key" />
                <svg style="width:20px;height:20px" viewBox="0 0 24 24">
                    <path fill="#ddd" d="${eye}" />
                </svg>
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
                    if (
                        $(this)
                            .val()
                            .trim()
                    ) {
                        secrets.push(
                            $(this)
                                .val()
                                .trim()
                        );
                    }
                });
                if (secrets.length == 1 && (!this.config.secrets || !this.config.secrets.length) && !this.config.active) {
                    this.config.active = true;
                }
                this.config.secrets = secrets.reverse();
                this.updateConfig();
                this.hideKeyFields();
                BdApi.showToast(`Secret key(s) were updated successfully`, {
                    type: 'success'
                });
            }
        });

        $('.key-fields svg').click(function(e) {
            console.log('HURR', e);
            if ($(this).prev().attr('type') == 'password') {
                $(this).prev().attr('type', 'text');
                $(this)
                    .children()
                    .attr('d', noeye);
            } else {
                $(this).prev().attr('type', 'password');
                $(this)
                    .children()
                    .attr('d', eye);
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
