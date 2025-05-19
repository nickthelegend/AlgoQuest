![Image](https://github.com/user-attachments/assets/89cc9c2e-d389-4eda-9c82-6d24e26224d5)
---
**AlgoQuest** is a real-time, PvP multiplayer mobile game built on the **Algorand blockchain**. Players explore a real-world map, battle others using unique NFT beasts, and earn **Quest Coins** to unlock rewards, merch, and evolution features. The game combines elements of Pokémon Go, Tamagotchi, and Web3 gaming to create a highly engaging and socially interactive experience.

---

## 🐉 Game Highlights

<img src="https://github.com/user-attachments/assets/4f2840d1-0568-4c4d-ad23-02e243ff0753" width="300"/>

### ⚔️ 1v1 Real-Time Battles

Challenge other players to real-time, one-on-one beast battles. Strategy, timing, and evolution matter. Battles can be triggered:

* Through the internet (PvP matchmaking)
* Locally via **Bluetooth** for IRL social gameplay

### 🧬 Unique NFT Beasts

* Mint your own **beast NFTs** on the Algorand blockchain
* Beasts are trainable and **evolvable**
* Ownership is decentralized and permanent

### 🌍 Real-World Exploration
<img src="https://github.com/user-attachments/assets/4bfd5fe7-a0e3-44ea-8a32-c557cb0efc5c" width="300"/>

* Integrated with real-world maps (via GPS)
* Players can find and open **treasure chests** at marked locations
* Rewards include Quest Coins and rare collectibles

### 💰 Quest Coins & Merch Rewards

* Earn **Quest Coins** by winning battles and completing treasure hunts
* Redeem coins for **exclusive merch** like t-shirts, mugs, bottles, and more

---

## 🛠️ Tech Stack

* **Frontend**: React Native + Expo
* **Backend**: Supabase (auth + storage), Algorand smart contracts
* **Smart Contracts**: Written in TEAL/PyTeal for minting, evolution, and token management
* **Location Services**: GPS + geofencing for treasure and IRL event triggers
* **Connectivity**: WebRTC / Bluetooth for real-time local battles
* **Connect Wallet**: WebSockets

---

## 📦 Features Overview

| Feature           | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| Real-time PvP     | Battle anyone live, locally or globally                         |
| NFT Beast Minting | Unique blockchain-based beast ownership and evolution           |
| Treasure Hunts    | Go to specific physical locations to unlock chests and loot     |
| Social Play       | Bluetooth battles encourage real-life meetups                   |
| Coin Economy      | Earn and spend Quest Coins on upgrades, evolutions, and rewards |
| Merch Integration | Exchange in-game currency for real-world goodies                |

---

## 🚀 Getting Started

1. **Clone the Repo**

   ```bash
   git clone https://github.com/nickthelegend/AlgoQuest
   cd AlgoQuest
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start the App**

   ```bash
   npm start
   ```

   Use an Android/iOS device or emulator via Expo Go.

---

## 🧱 Folder Structure

* `/app` - Main screens and navigation
* `/components` - Reusable UI elements
* `/contracts` - Smart contract logic (Algorand)
* `/hooks` - Custom logic (Bluetooth, geolocation, etc.)
* `/context` - Global state management
* `/assets` - Icons, images, fonts
* `/lib` - Utility libraries and helpers


---

## 🤝 Contributing

We welcome contributions. If you’re a game dev, smart contract wizard, or mobile UI/UX nerd — join us.

   * 1 Fork the repo 
   * 2 Create your feature branch 
   * 3 Submit a PR
---

# To-do:
* [ ] Edit the Connections, make it guestures , dragable guestures
* [X] Add Functionality to Send and recieve ,
* [X] Add the Quest Tokens, Index the Assets and show the number of NFTs.
* [X] Cron Jobs on Quest Creator, Smart contract
* [X] Implement the Maps API, with Geo Fencing,
* [X] Quest Creation, Token Collection nearby radius 10m,
* [X] Implement anti cheat methods
* [ ] Limit The Speed of Moving object to be ideal with the person who is walkin, clears the people with the veichles having chance to win
* [ ] Leaderboard
* [X] friends, friend requests sending and reciving, notfications of friend request recieved and other stuff
* [X] fix the header showing in other screens
* [ ] Make it in Web2 Then we implement in Web3
* [X] Sew the header .tsx is visible in the create-wallet and all the stuff i want it to be shown only in the page with the tab view ,, 
* [X]  i dont like the uint i like uuid , then it will look cool, streaks also i want toimplement, if user sends the request the other user must catch it, if he catches it then its like streak, bond
* [X] Interests, Create 2D NFT avatar, male or female, customize the avatar, limit the request 5 requests
* [X] Game, Inventory,  Marketplace , in game tab
* [ ] Challenge Nearby Battle Arena game, 
* [X] Quests List Out the quests that are active
* [X] Send Quest Coins to an ID, Qr code should be also avaliable when click , scan qr we can also use camera to scan and send funds to that account
* [X] DAO Back button , Create new DAO , What to do DAO, options also , yes or No --- Only Front End
* [X] Quest Contract, Quest Contract Signing, Server side quest contract trigger,
* [X] Side Bar edit, add RPS , add chess etc, 
* [ ] Quest Frontend changes
* [ ] Quest Winner Picking and Contract execution
* [ ] Quest Contract Reward Distribution
* [ ] Arena Beasts Show on the Arena after picking fix the ipfs showing

---

## 🌐 Links

* 🔗 [Official Website](#) — *Coming soon*
* 📣 [Twitter](#) — Game updates and announcements
* 🎮 [TestNet Faucet](#) — Get free ALGO for testing
---

## License

MIT License. See [LICENSE](LICENSE) for details.

---






