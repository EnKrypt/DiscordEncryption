# Discord Encryption

Configurable end to end encryption for Discord.

---

This project was oiriginally inspired by [Hmeritt's discord-encryption](https://github.com/Hmerritt/discord-encryption)

```diff
! Do not actually use the above project. !  
! It violates security conventions and the source code isn't transparent enough !  
! to remove suspicions of possible malicious activity. !
```

## Installation
* You will need [Bandaged BetterDiscord](https://rauenzi.github.io/BetterDiscordApp/), which will exist along with your existing Discord. Install that first if you don't have it.
* Take the [`encryption.plugin.js`](https://raw.githubusercontent.com/EnKrypt/DiscordEncryption/master/encryption.plugin.js) file from this repository, and put it in your plugins folder. You can find where your plugins folder is from Discord User Settings -> Plugins -> Open Plugin Folder
* Restart Discord.

## Usage

* Left click on the padlock icon next to the message textbox to toggle encryption on or off for your outgoing messages.
* Right click the padlock icon to configure your secret keys. All messages will be automatically decrypted as long as you have the right key.
* Use the radio button next to the keys to select your primary secret key. This will be used to encrypt your outgoing messages when encryption is on.
* You can click on the info icon next to decrypted messages to see more information about the raw message and decryption process.
