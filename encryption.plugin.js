//META{"name":"DiscordEncryption","website":"https://github.com/EnKrypt/DiscordEncryption","source":"https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/encryption.plugin.js"}*//

class DiscordEncryption {
    constructor() {
        this.buttonElement = undefined;
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
    }

    observer(changes) {
        if (changes.target.querySelector('.da-channelTextArea')) {
            this.refreshButton();
        }
    }

    // Unload and load encryption button and handlers
    refreshButton() {
        $('.encryptionButton').remove();
        $('button.da-attachButton').after(
            `<svg id="encryptionButton" class="encryptionButton" style="width:24px;height:24px;padding-right:8px;" viewBox="0 0 24 24"><path fill d="M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8.9,6C8.9,4.29 10.29,2.9 12,2.9C13.71,2.9 15.1,4.29 15.1,6V8H8.9V6M16,16H13V19H11V16H8V14H11V11H13V14H16V16Z" /></svg>`
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
    }

    showKeyFields() {
        console.log('KEY FIELDS');
    }

    // Update the current config state to localStorage
    updateConfig() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }
}
