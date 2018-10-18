//META{"name":"DiscordEncryption","website":"https://github.com/EnKrypt/DiscordEncryption","source":"https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/encryption.plugin.js"}*//

/*
    I am aware that the code here is not neat.
    The documentation for BetterDiscord, BandagedBD, and Discord UI
    is tremendously lacking, or broken and incomplete where present.
    Single file limitations, needing to modify React internal state
    without access to React Components, having access to JQuery only,
    has resulted in a combination of UI hacks and large inline code.

    However, things have been separated as nicely as possible,
    nothing malignant is present (even tokens are handled securely),
    and while not much can be said for the readability of this code,
    I want to encourage you to go through it anyway and verify
    that nothing wrong is being done, because if plugin authors
    wanted to, they could do a LOT of harm with what is available.

    TODO: Support for light theme
    TODO: Per channel config
*/

class DiscordEncryption {
    constructor() {
        this.crypto = require('crypto');
        this.buttonElement = undefined;
        this.timeoutId = undefined;
        this.messageSent = false;
        this.config = {
            active: false,
            secrets: []
        };

        this.configKey = `${this.getName()}Config`;
        this.messageSelector =
            '.da-message .da-content .da-container .da-markup:not(.da-embedContentInner)';
        this.textareaSelector = '.da-chat .da-content form textarea';
        this.encryptionHeader = '-----ENCRYPTED MESSAGE-----';
    }

    getName() {
        return 'DiscordEncryption';
    }
    getDescription() {
        return 'Configurable end to end encryption for Discord';
    }
    getVersion() {
        return '0.0.3';
    }
    getAuthor() {
        return 'EnKrypt';
    }

    start() {
        // BdApi.showToast(`${this.getName()} Started`, { type: 'success' });
    }

    stop() {
        // BdApi.showToast(`${this.getName()} Stopped`, { type: 'warn' });
    }

    load() {
        // BdApi.showToast(`${this.getName()} Loaded`, { type: 'info' });
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
                opacity: 1;
                visibility: visible;
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
                opacity: 0;
                visibility: hidden;
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
        BdApi.injectCSS(
            'modalStyle',
            `
            .bd-modal code {
                display: block;
                padding: 1em;
                background: rgba(0,0,0,0.2);
                border-radius: 0.5em;
                overflow-wrap: break-word;
            }
            `
        );
        BdApi.injectCSS(
            'infoStyle',
            `
            .encryption-info {
                display: none;
            }
            .encryption-icon {
                font-size: 1.2em;
                color: #1C9C6D;
                cursor: pointer;
            }
            .encryption-icon.error {
                color: #9C3C3C;
            }
            .show-secret-button {
                cursor: pointer;
                color: #92a9fa;
                font-weight: 600;
            }
            .red-text {
                color: #ac5c5c;
            }
            `
        );

        // Add overlay element
        $('.app').after(`<div class="overlay-wrapper hide"></div>`);
        $('.overlay-wrapper')[0].addEventListener('click', e => {
            this.hideKeyFields();
        });

        // Global handlers
        $(document).on('keydown', this.textareaSelector, e => {
            if (
                e.which == 13 &&
                this.config.active &&
                $('.encryptionButton').length &&
                $(this.textareaSelector)
                    .val()
                    .trim()
            ) {
                e.preventDefault();
                e.stopPropagation();
                this.sendMessage(
                    this.encryptMessage(
                        $(this.textareaSelector)
                            .val()
                            .trim()
                    )
                );
                this.clearTextArea();
            }
        });
        $(document).on('click', '.encryption-icon', function() {
            BdApi.alert(
                'Message Information',
                $(this)
                    .siblings('.encryption-info')
                    .html()
            );
        });
        $(document).on('click', '.show-secret-button', function() {
            if (
                $(this)
                    .html()
                    .trim() == 'Show'
            ) {
                $(this).html('Hide');
                $(this)
                    .siblings('.show-secret-text')
                    .html($(this).siblings('.show-secret-text')[0].id);
            } else if (
                $(this)
                    .html()
                    .trim() == 'Hide'
            ) {
                $(this).html('Show');
                $(this)
                    .siblings('.show-secret-text')
                    .html(
                        $(this)
                            .siblings('.show-secret-text')[0]
                            .id.replace(/./g, '*')
                    );
            }
        });

        // Get user token (careful with this bit)
        var DiscordLocalStorageProxy = document.createElement('iframe');
        DiscordLocalStorageProxy.style.display = 'none';
        DiscordLocalStorageProxy.id = 'DiscordLocalStorageProxy';
        document.body.appendChild(DiscordLocalStorageProxy);
        var token = DiscordLocalStorageProxy.contentWindow.localStorage
            .getItem('token')
            .replace(/"/g, '');
        bdStorage.set('token', token);
    }

    observer(changes) {
        if (changes.target.querySelector('.da-channelTextArea')) {
            this.refreshButton();
        }
        // Perform decryption when a message comes in
        if (
            changes.addedNodes.length &&
            changes.addedNodes[0].nodeType == Node.ELEMENT_NODE &&
            changes.addedNodes[0].querySelectorAll(this.messageSelector).length
        ) {
            for (var node of changes.addedNodes[0].querySelectorAll(
                this.messageSelector
            )) {
                node.innerHTML = this.decryptMessage(node.innerHTML);
            }
            // Scroll to bottom if own message
            if (this.messageSent) {
                $('.da-messages.da-scroller')[0].scrollTop = $(
                    '.da-messages.da-scroller'
                )[0].scrollHeight;
                this.messageSent = false;
            }
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

        // Handlers for button and key fields
        this.buttonElement.addEventListener('click', e => {
            if (this.config.secrets && this.config.secrets.length) {
                this.config.active = !this.config.active;
                this.updateConfig();
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
                if (
                    secrets.length == 1 &&
                    (!this.config.secrets || !this.config.secrets.length) &&
                    !this.config.active
                ) {
                    this.config.active = true;
                    // Decrypt existing messages
                    $(this.messageSelector).each(function(index) {
                        $(this).html = this.decryptMessage($(this).html);
                    });
                }
                if (secrets.length == 0 && this.config.active) {
                    this.config.active = false;
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
            if (
                $(this)
                    .prev()
                    .attr('type') == 'password'
            ) {
                $(this)
                    .prev()
                    .attr('type', 'text');
                $(this)
                    .children()
                    .attr('d', noeye);
            } else {
                $(this)
                    .prev()
                    .attr('type', 'password');
                $(this)
                    .children()
                    .attr('d', eye);
            }
        });
    }

    showKeyFields() {
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
        setTimeout(() => {
            this.refreshButton();
        }, 300);
    }

    // Update the current config state to localStorage
    updateConfig() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }

    decryptMessage(text) {
        if (
            text.startsWith(this.encryptionHeader) &&
            this.config.secrets &&
            this.config.secrets.length
        ) {
            var result = `<span class="encryption-icon error">&#9888;</span>&nbsp;&nbsp;&nbsp;<div class="encryption-info">
                This message could not be decrypted properly<br /><br />
                This can happen for one or more of the following reasons:<br />
                1. You do not have the secret that was used to encrypt this message<br />
                2. The sender included the encrypted message header on a non-encrypted plaintext message<br />
                3. The message was encrypted wrongly or the encrypted data is corrupted<br /><br /><br />
                Raw Message:<br /><br />
                <code>${text}</code>
            </div><span class="red-text">Could not decrypt message</span>`;
            for (var secret of this.config.secrets) {
                try {
                    result = `<span class="encryption-icon">&#128274;</span>&nbsp;&nbsp;&nbsp;<div class="encryption-info">
                                This message was successfully decrypted with a secret that you possess.<br /><br />
                                Cipher: AES-128-GCM<br /><br />
                                Secret: <span class="show-secret-text" id="${secret}">${secret.replace(
                        /./g,
                        '*'
                    )}</span> &nbsp; &nbsp; <span class="show-secret-button">Show</span><br /><br /><br />
                        Raw Message:<br /><br />
                        <code>${text}</code>
                    </div>${this.decrypt(
                        this.pwtokey(secret),
                        text.replace(this.encryptionHeader, '').trim()
                    )}`;
                } catch (error) {} // No need to do anything. We know the key did not work.
            }
            return result;
        } else {
            return text;
        }
    }

    encryptMessage(text) {
        if (
            this.config.active &&
            this.config.secrets &&
            this.config.secrets.length
        ) {
            return `${this.encryptionHeader}\n${this.encrypt(
                this.pwtokey(this.config.secrets[0]),
                text
            )}`;
        } else {
            return text;
        }
    }

    // Programmatically send a discord message
    sendMessage(message) {
        $.ajax({
            type: 'POST',
            url: `https://discordapp.com/api/channels/${window.location.pathname
                .split('/')
                .pop()}/messages`,
            headers: {
                Authorization:
                    localStorage.getItem('token') || bdStorage.get('token')
            },
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ content: message }),
            error: (req, error, exception) => {
                this.messageSent = false;
                BdApi.alert(
                    'Could not send message',
                    `<pre>${message}</pre><br />This message was not sent.<br /><br /><code>${
                        req.responseText
                    }</code>`
                );
            }
        });
        this.messageSent = true;
    }

    clearTextArea() {
        var element = $(this.textareaSelector)[0];
        var cursor =
            element[
                Object.keys(element).find(key =>
                    key.startsWith('__reactInternalInstance')
                )
            ];
        while (
            !(
                cursor.stateNode &&
                cursor.stateNode.constructor &&
                cursor.stateNode.constructor.displayName ==
                    'ChannelTextAreaForm'
            )
        ) {
            cursor = cursor.return;
        }
        cursor.stateNode.setState({
            textValue: ''
        });
    }

    /*
        Thanks to mwgamera for helping me with the actual encryption and decryption bit
        You can read his implementation here :
        https://gist.github.com/mwgamera/5bad53a3c3721b8909bfe6bee2f83f0f
    */

    pwtokey(pass, salt = '', iter = 100) {
        return this.crypto.pbkdf2Sync(pass, salt, iter, 16, 'sha256');
    }

    encrypt(key, msg) {
        var iv = this.crypto.randomBytes(16);
        var ctx = this.crypto.createCipheriv('aes-128-gcm', key, iv);
        return Buffer.concat([
            iv,
            ctx.update(msg, 'utf8'),
            ctx.final(),
            ctx.getAuthTag()
        ]).toString('base64');
    }

    decrypt(key, msg) {
        var buf = Buffer.from(msg, 'base64');
        var ctx = this.crypto.createDecipheriv(
            'aes-128-gcm',
            key,
            buf.slice(0, 16)
        );
        ctx.setAuthTag(buf.slice(-16));
        return ctx.update(buf.slice(16, -16), null, 'utf8') + ctx.final('utf8');
    }
}
