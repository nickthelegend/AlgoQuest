![Image](https://github.com/user-attachments/assets/89cc9c2e-d389-4eda-9c82-6d24e26224d5)
---
**AlgoQuest** is a real-time, PvP multiplayer mobile game built on the **Algorand blockchain**. Players battle others using unique NFT beasts, explore real-world maps, and earn **Quest Coins** to unlock rewards, merch, and evolution features. The game combines elements of Pokémon Go, Tamagotchi, and Web3 gaming to create a highly engaging and socially interactive experience.

---

## 🐉 Game Highlights

<img src="https://github.com/user-attachments/assets/4f2840d1-0568-4c4d-ad23-02e243ff0753" width="300"/>

### ⚔️ 1v1 Real-Time Battles

Challenge other players to real-time, one-on-one beast battles with two connection methods:

* **Room Code Matchmaking**: Create or join battles using unique 6-character codes
* **Nearby Connections**: Discover and battle players physically nearby via Bluetooth/WiFi
* Real-time WebSocket synchronization for smooth, responsive gameplay
* Turn-based combat with elemental effectiveness and strategic depth

### 🧬 Unique NFT Beasts

* Mint your own **beast NFTs** on the Algorand blockchain
* Beasts are trainable and **evolvable**
* Each beast has unique stats, elements, and abilities
* Ownership is decentralized and permanent

### 🌍 Real-World Exploration
<img src="https://github.com/user-attachments/assets/4bfd5fe7-a0e3-44ea-8a32-c557cb0efc5c" width="300"/>

* Integrated with real-world maps (via GPS)
* Players can find and open **treasure chests** at marked locations
* Rewards include Quest Coins and rare collectibles

### 💰 Quest Coins & Merch Rewards

* Earn **Quest Coins** by winning battles and completing treasure hunts
* Redeem coins for **exclusive merch** like t-shirts, mugs, bottles, and more

### 🔐 Wallet Integration

* **PeraWallet Support**: Connect your existing Algorand wallet seamlessly
* **Built-in Wallet**: Create a new wallet directly in the app
* Secure storage using Expo SecureStore
* Full Algorand blockchain integration

---

## 🛠️ Tech Stack

* **Frontend**: React Native + Expo
* **Backend**: Supabase (PostgreSQL database + real-time WebSocket channels)
* **Blockchain**: Algorand (algosdk + PeraWallet Connect)
* **Smart Contracts**: Written in TEAL/PyTeal for minting, evolution, and token management
* **Location Services**: GPS + geofencing for treasure and IRL event triggers
* **Connectivity**: Expo Nearby Connections for local device discovery
* **Real-time Sync**: Supabase real-time channels for battle synchronization
* **Testing**: Jest + fast-check for property-based testing

---

## 📦 Features Overview

| Feature                | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| Real-time PvP          | Battle anyone live with room codes or nearby connections        |
| Room Code System       | Create/join battles with unique 6-character codes               |
| Nearby Connections     | Discover and battle players physically nearby                   |
| WebSocket Sync         | Real-time battle state synchronization                          |
| NFT Beast Minting      | Unique blockchain-based beast ownership and evolution           |
| PeraWallet Integration | Connect existing Algorand wallets                               |
| Treasure Hunts         | Go to specific physical locations to unlock chests and loot     |
| Social Play            | Bluetooth battles encourage real-life meetups                   |
| Coin Economy           | Earn and spend Quest Coins on upgrades, evolutions, and rewards |
| Merch Integration      | Exchange in-game currency for real-world goodies                |

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn
* Expo CLI
* iOS Simulator (Mac) or Android Emulator
* Physical device for testing nearby connections

### Installation

1. **Clone the Repo**

   ```bash
   git clone https://github.com/nickthelegend/AlgoQuest
   cd AlgoQuest
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Supabase**

   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   See [Supabase Configuration](#supabase-configuration) for detailed setup.

4. **Set Up Database Schema**

   Run the SQL schema in your Supabase project:

   ```bash
   # Copy the contents of schema.sql and run in Supabase SQL Editor
   ```

5. **Start the App**

   ```bash
   npm start
   ```

   Use an Android/iOS device or emulator via Expo Go.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in CI mode (no watch)
npm test -- --watchAll=false
```

---

## 🧱 Folder Structure

* `/app` - Main screens and navigation
  * `/(game)` - Battle system screens (find-players, battle-lobby, battle-arena)
  * `/(tabs)` - Main tab navigation screens
  * `/beast` - Beast management screens
* `/components` - Reusable UI elements
* `/contracts` - Smart contract logic (Algorand)
* `/lib` - Core business logic and utilities
  * `battleRoom.ts` - Battle room creation and management
  * `battleState.ts` - Battle state management and calculations
  * `battleSync.ts` - Real-time synchronization logic
  * `roomCode.ts` - Room code generation and validation
  * `peraWallet.ts` - PeraWallet integration
  * `supabase.ts` - Supabase client configuration
  * `realtimeConnection.ts` - WebSocket connection management
  * `errorHandling.ts` - Centralized error handling
* `/context` - Global state management
* `/assets` - Icons, images, fonts
* `/hooks` - Custom React hooks

---

## 🎮 Battle System

### Room Code System

The battle system uses unique 6-character alphanumeric room codes for matchmaking:

**Creating a Battle Room:**
1. Navigate to "Find Players" screen
2. Select your beast
3. Tap "Create Battle Room"
4. Share the generated room code with your opponent

**Joining a Battle Room:**
1. Navigate to "Find Players" screen
2. Enter the 6-character room code
3. Tap "Join Battle"
4. Wait for the battle to start

**Room Code Format:**
* 6 characters (uppercase letters and numbers)
* Excludes ambiguous characters (0, O, I, 1, L)
* Example: `A3B7K9`

### Nearby Connections

Discover and battle players physically nearby:

**Requirements:**
* Bluetooth enabled
* Location permissions granted
* Both players on the same screen

**How to Use:**
1. Navigate to "Find Players" screen
2. Grant Bluetooth and location permissions
3. Wait for nearby players to appear
4. Tap on a player to send a battle invitation
5. Opponent accepts the invitation
6. Battle begins automatically

### Real-time Battle Mechanics

Battles use WebSocket channels for instant synchronization:

* **Turn-based Combat**: Each player has 30 seconds per turn
* **Elemental System**: Fire, Water, Earth, Wind, Light, Dark
* **Damage Calculation**: Based on attack, defense, and elemental effectiveness
* **Energy System**: Abilities cost energy, regenerates over time
* **Win Condition**: Reduce opponent's beast health to zero

---

## 🔐 PeraWallet Integration

### Connecting PeraWallet

1. **From Create Wallet Screen:**
   * Tap "Connect with PeraWallet"
   * PeraWallet app opens (or QR code displays)
   * Approve the connection in PeraWallet
   * Your wallet address is securely stored

2. **Wallet Features:**
   * View your Algorand balance
   * Send and receive ALGO
   * Manage your beast NFTs
   * Sign transactions securely

### PeraWallet Setup

**Prerequisites:**
* PeraWallet app installed on your device
* Algorand wallet with some ALGO for transactions

**Configuration:**
```typescript
// PeraWallet is configured for Algorand MainNet (Chain ID: 416001)
// To use TestNet, update the chainId in lib/peraWallet.ts
```

---

## 🗄️ Supabase Configuration

### Database Setup

1. **Create a Supabase Project:**
   * Go to [supabase.com](https://supabase.com)
   * Create a new project
   * Note your project URL and anon key

2. **Run Database Schema:**
   * Open Supabase SQL Editor
   * Copy contents of `schema.sql`
   * Execute the SQL

3. **Configure Environment Variables:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Real-time Channels

The app uses Supabase real-time channels for battle synchronization:

* **Channel Format**: `battle:{battleId}`
* **Message Types**: move, state_update, player_joined, player_left, battle_end
* **Automatic Reconnection**: Handles disconnections gracefully

### Database Tables

* **users**: User profiles and wallet addresses
* **beasts**: Beast NFTs with stats and metadata
* **battles**: Battle state and history
* **beast_abilities**: Available abilities for beasts
* **friend_requests**: Social features

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm test
```

Unit tests cover:
* Room code generation and validation
* Battle state calculations
* Damage calculations with elemental effectiveness
* Database query functions

### Property-Based Tests

The app uses `fast-check` for property-based testing:

```bash
# Run all tests including property tests
npm test
```

Property tests validate:
* Room code uniqueness across many generations
* Battle state consistency
* Damage calculation correctness
* Turn switching logic

---

## 🤝 Contributing

We welcome contributions! If you're a game dev, smart contract wizard, or mobile UI/UX enthusiast — join us.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

* Follow the existing code style
* Write tests for new features
* Update documentation as needed
* Test on both iOS and Android

---

## 📱 Platform Support

* **iOS**: iOS 13.0 or higher
* **Android**: Android 5.0 (API 21) or higher
* **Nearby Connections**: Requires physical devices (not available in simulators)

---

## 🐛 Troubleshooting

### Common Issues

**Supabase Connection Errors:**
* Verify your `.env` file has correct credentials
* Check Supabase project is active
* Ensure real-time is enabled in Supabase dashboard

**PeraWallet Connection Fails:**
* Ensure PeraWallet app is installed
* Check you're on the correct network (MainNet/TestNet)
* Try disconnecting and reconnecting

**Nearby Connections Not Working:**
* Grant Bluetooth and location permissions
* Ensure both devices are on the same screen
* Try restarting the app
* Nearby connections only work on physical devices

**Battle Synchronization Issues:**
* Check internet connection
* Verify Supabase real-time is enabled
* Try refreshing the battle screen

---

## 🌐 Links

* 🔗 [Official Website](#) — *Coming soon*
* 📣 [Twitter](#) — Game updates and announcements
* 🎮 [Algorand TestNet Faucet](https://bank.testnet.algorand.network/) — Get free ALGO for testing
* 📚 [Supabase Docs](https://supabase.com/docs) — Backend documentation
* 🔐 [PeraWallet Docs](https://docs.perawallet.app/) — Wallet integration guide

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

* Algorand Foundation for blockchain infrastructure
* Supabase for backend services
* Expo team for the amazing development platform
* PeraWallet for seamless wallet integration
* The open-source community

---

**Built with ❤️ by the AlgoQuest Team**
