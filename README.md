# Discord Encryption

Configurable end to end encryption for Discord.

[![License](https://img.shields.io/github/license/EnKrypt/DiscordEncryption.svg)](https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/LICENSE)

---

This project was originally inspired by [Hmeritt's discord-encryption](https://github.com/Hmerritt/discord-encryption)

**DO NOT actually use the above linked project. I have found the source code to violate security conventions and intentionally obfuscate or confuse implemented functionality, pointing to ill intention or (hopefully) just negligence on the author's part.**

**Although this current project also has some issues with ease of readability, it follows good practices, and I encourage users to review the source code before using it.**

## Installation
* You will need [Bandaged BetterDiscord](https://rauenzi.github.io/BetterDiscordApp/), which will exist alongside your existing Discord installation. Install this first if you don't have it.
* Take the [`encryption.plugin.js`](https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/encryption.plugin.js) file from this repository, and put it in your plugins folder. You can find where your plugins folder is from `Discord User Settings -> Plugins -> Open Plugin Folder`
* Restart Discord.

## Usage
* Left click on the padlock icon next to the message textbox to toggle encryption on or off for your outgoing messages.

<p align="center">
  <img src="https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/images/lock-icon-on.png">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/images/lock-icon-off.png">
</p>

* Right click the padlock icon to configure your secret keys. All messages will be automatically decrypted as long as you have the right key.

<p align="center">
  <img src="https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/images/auto-decrypt.png">
</p>

* The first key you enter at the bottom is your primary secret key (shown in green). This will be used to encrypt your outgoing messages when encryption is on.

<p align="center">
  <img src="https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/images/secrets-config.png">
</p>

* You can click on the icon next to successfully or failed decrypted messages to see more information.

<p align="center">
  <img src="https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/images/message-info.png">
</p>

## TODO
* Support for light theme (Pull Requests are welcome)
* Per channel configurations

### There is no support for mobile as of yet
This is a sad consequence of Discord :
* not caring about end to end encryption (which should be a feature on any communication app)
* not caring about the community where people want to make mods, plugins and provide extra functionality and support
* not caring about making their projects open source (which is a viable strategy for any business, contrary to popular uninformed opinion)

Short of making Android and iOS discord clients from scratch, which most developers do not have the time for, there's not much that can be done for mobile support. Take this up with Discord, and hopefully there will be enough voices to make a difference. I will also help and support anyone who is attempting to launch a FOSS alternative to Discord.
