# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive refactoring of the AlgoQuest Expo React Native application's battle system. The refactoring includes removing quest functionality, implementing battle room codes for PVP matchmaking, integrating real-time WebSocket-based battle mechanics, adding PeraWallet integration for Algorand wallet connectivity, and recreating the database schema from scratch.

## Glossary

- **Battle System**: The PVP (Player vs Player) combat system where users battle their beasts against each other
- **Battle Room**: A virtual space where two players connect to engage in a PVP battle
- **Room Code**: A unique 6-character alphanumeric identifier used to join specific battle rooms
- **Beast**: A digital creature owned by a user that participates in battles
- **Expo Nearby Connections**: A React Native library for discovering and connecting to nearby devices via Bluetooth/WiFi
- **Real-time WebSocket**: Supabase real-time channels used for synchronizing battle state between players
- **PeraWallet**: An Algorand wallet provider for mobile applications
- **Supabase**: The backend-as-a-service platform providing database and real-time functionality
- **AlgoQuest Application**: The Expo React Native mobile application being refactored
- **Quest System**: The existing feature being removed that provided single-player challenges
- **PVP Section**: The user interface section where players can find opponents and manage battles
- **Battle State**: The current status of a battle including health, energy, turns, and moves

## Requirements

### Requirement 1: Database Schema Recreation

**User Story:** As a system administrator, I want to recreate the database schema from scratch, so that the application has a clean foundation without quest-related tables.

#### Acceptance Criteria

1. WHEN the schema is applied THEN the system SHALL create a users table with wallet_address, full_name, email, roll_number, branch, gender, interests, avatar_url, and profile metadata
2. WHEN the schema is applied THEN the system SHALL create a beasts table with owner_id, name, power, element, image_url, metadata, allocated_stats, and combat statistics
3. WHEN the schema is applied THEN the system SHALL create a battles table with player1_id, player2_id, player1_beast_id, player2_beast_id, status, current_turn, turn_number, turn_time_remaining, battle_data, and room_code fields
4. WHEN the schema is applied THEN the system SHALL NOT include any quest-related tables or columns
5. WHEN the schema is applied THEN the system SHALL create appropriate indexes on wallet_address, owner_id, room_code, and battle status fields for query performance

### Requirement 2: Quest System Removal

**User Story:** As a developer, I want to remove all quest-related functionality from the codebase, so that the application focuses solely on PVP battles.

#### Acceptance Criteria

1. WHEN quest code is removed THEN the system SHALL delete all quest-related components, screens, and navigation routes
2. WHEN quest code is removed THEN the system SHALL remove quest-related database queries and mutations
3. WHEN quest code is removed THEN the system SHALL remove quest-related state management and context providers
4. WHEN quest code is removed THEN the system SHALL update navigation to remove quest menu items and routes
5. WHEN quest code is removed THEN the system SHALL ensure no broken imports or references remain in the codebase

### Requirement 3: Battle Room Code System

**User Story:** As a player, I want to create and join battle rooms using unique room codes, so that I can easily connect with specific opponents.

#### Acceptance Criteria

1. WHEN a player creates a battle room THEN the system SHALL generate a unique 6-character alphanumeric room code
2. WHEN a player enters a valid room code THEN the system SHALL connect them to the corresponding battle room
3. WHEN a player enters an invalid room code THEN the system SHALL display an error message indicating the room was not found
4. WHEN a battle room is created THEN the system SHALL display the room code prominently for the creator to share
5. WHEN a battle room has been waiting for more than 10 minutes THEN the system SHALL automatically clean up and remove the room

### Requirement 4: Enhanced Find Players UI

**User Story:** As a player, I want an improved find players interface with battle room functionality, so that I can easily discover opponents and manage battle connections.

#### Acceptance Criteria

1. WHEN the find players screen loads THEN the system SHALL display a section for creating a new battle room with a generated room code
2. WHEN the find players screen loads THEN the system SHALL display a section for entering a room code to join an existing battle
3. WHEN the find players screen loads THEN the system SHALL display nearby players discovered via Expo Nearby Connections
4. WHEN no players are found nearby THEN the system SHALL display a helpful fallback message encouraging room code usage
5. WHEN a player selects a beast THEN the system SHALL persist the selection and display it prominently in the UI

### Requirement 5: Expo Nearby Connections Integration

**User Story:** As a player, I want to discover and connect with nearby players using Bluetooth/WiFi, so that I can battle with people in my physical proximity.

#### Acceptance Criteria

1. WHEN nearby scanning starts THEN the system SHALL request necessary Bluetooth and location permissions
2. WHEN nearby scanning is active THEN the system SHALL advertise the player's presence to other nearby devices
3. WHEN a nearby player is discovered THEN the system SHALL display their information in the players list
4. WHEN a player sends a battle challenge via nearby connections THEN the system SHALL transmit the battle room code and player information
5. WHEN a player receives a battle invitation THEN the system SHALL display a notification with accept/decline options

### Requirement 6: Real-time WebSocket Battle System

**User Story:** As a player, I want battles to synchronize in real-time using WebSockets, so that I experience smooth, responsive gameplay with my opponent.

#### Acceptance Criteria

1. WHEN a battle starts THEN the system SHALL establish a Supabase real-time channel for the battle room
2. WHEN a player makes a move THEN the system SHALL broadcast the move to the opponent via the real-time channel
3. WHEN a player receives an opponent's move THEN the system SHALL update the local battle state immediately
4. WHEN battle state changes occur THEN the system SHALL synchronize health, energy, turn order, and move history across both clients
5. WHEN a player disconnects THEN the system SHALL handle the disconnection gracefully and notify the opponent

### Requirement 7: Battle State Management

**User Story:** As a player, I want the battle system to accurately track and synchronize game state, so that battles are fair and consistent for both players.

#### Acceptance Criteria

1. WHEN a battle is created THEN the system SHALL initialize battle_data with empty moves array and initial beast states
2. WHEN a move is executed THEN the system SHALL calculate damage, apply effects, and update both beasts' health and energy
3. WHEN a turn completes THEN the system SHALL switch the current_turn to the other player and reset the turn timer
4. WHEN a beast's health reaches zero THEN the system SHALL declare the opponent as the winner and end the battle
5. WHEN battle state updates THEN the system SHALL persist changes to the database for recovery and history

### Requirement 8: PeraWallet Integration

**User Story:** As a user, I want to connect my existing Algorand wallet using PeraWallet, so that I can use my established wallet instead of creating a new one.

#### Acceptance Criteria

1. WHEN the create wallet screen loads THEN the system SHALL display an option to connect with PeraWallet
2. WHEN a user selects PeraWallet connection THEN the system SHALL initialize the @perawallet/connect library
3. WHEN PeraWallet connection is initiated THEN the system SHALL open the PeraWallet app or display a QR code for connection
4. WHEN PeraWallet connection succeeds THEN the system SHALL retrieve the wallet address and store it securely
5. WHEN PeraWallet connection succeeds THEN the system SHALL create or update the user profile in the database with the wallet address

### Requirement 9: Battle Arena Real-time Synchronization

**User Story:** As a player, I want the battle arena to reflect real-time game state changes, so that I see my opponent's actions immediately.

#### Acceptance Criteria

1. WHEN the battle arena loads THEN the system SHALL subscribe to the battle's real-time channel
2. WHEN an opponent makes a move THEN the system SHALL animate the attack and update health/energy bars in real-time
3. WHEN it becomes my turn THEN the system SHALL enable my ability buttons and start the turn timer
4. WHEN the turn timer expires THEN the system SHALL automatically skip the turn and switch to the opponent
5. WHEN the battle ends THEN the system SHALL display the winner and provide options to return to the main menu

### Requirement 10: Error Handling and Fallbacks

**User Story:** As a player, I want the application to handle errors gracefully, so that I have a smooth experience even when issues occur.

#### Acceptance Criteria

1. WHEN a network error occurs during battle THEN the system SHALL display an error message and attempt to reconnect
2. WHEN a player's beast data fails to load THEN the system SHALL display a fallback message and prevent battle initiation
3. WHEN a room code is invalid THEN the system SHALL provide clear feedback and allow the user to try again
4. WHEN permissions are denied THEN the system SHALL explain why permissions are needed and provide a way to grant them
5. WHEN a real-time connection fails THEN the system SHALL log the error and provide options to retry or exit the battle

### Requirement 11: UI/UX Improvements

**User Story:** As a player, I want an intuitive and visually appealing interface, so that I can easily navigate and enjoy the battle system.

#### Acceptance Criteria

1. WHEN the find players screen displays THEN the system SHALL use consistent styling with blur effects and gradients
2. WHEN battle rooms are listed THEN the system SHALL display room codes, player names, and beast information clearly
3. WHEN a battle is in progress THEN the system SHALL show health bars, energy bars, turn indicators, and move animations
4. WHEN loading states occur THEN the system SHALL display appropriate loading indicators
5. WHEN user actions are required THEN the system SHALL provide clear call-to-action buttons and instructions
