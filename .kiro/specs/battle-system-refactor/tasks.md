# Implementation Plan

- [x] 1. Database Schema Setup





  - Create new schema.sql file with users, beasts, battles, and beast_abilities tables
  - Add indexes for performance optimization
  - Remove all quest-related tables and columns
  - Add room_code column to battles table with unique constraint
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for room code uniqueness
  - **Property 1: Room Code Uniqueness**
  - **Validates: Requirements 3.1**
-

- [x] 2. Remove Quest System




  - Search and remove all quest-related files and components
  - Remove quest routes from navigation
  - Remove quest-related database queries
  - Remove quest state management and context
  - Update imports and fix any broken references
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Verify quest removal completeness
  - Run TypeScript compiler to ensure no broken imports
  - Search codebase for "quest" references
  - _Requirements: 2.5_
-

- [x] 3. Install Required Dependencies




  - Install @perawallet/connect package
  - Install fast-check for property-based testing
  - Verify expo-nearby-connections is properly configured
  - Update package.json with new dependencies
  - _Requirements: 8.1, 8.2_
-

- [x] 4. Implement Room Code Generation System




  - Create generateRoomCode utility function
  - Implement uniqueness check against database
  - Add retry logic for collision handling
  - Create room code validation function
  - _Requirements: 3.1_

- [ ]* 4.1 Write property test for room code generation
  - **Property 1: Room Code Uniqueness**
  - **Validates: Requirements 3.1**

- [ ]* 4.2 Write unit tests for room code utilities
  - Test code format validation
  - Test uniqueness checking
  - Test collision retry logic
  - _Requirements: 3.1_

-

- [ ] 5. Create Battle Room Management Module



  - Implement createBattleRoom function with room code generation
  - Implement joinBattleRoom function with code validation
  - Implement getBattleByRoomCode query function
  - Add room cleanup function for stale rooms (>10 minutes)
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 5.1 Write property test for room joining
  - **Property 2: Room Code Join Success**
  - **Validates: Requirements 3.2**

- [ ]* 5.2 Write property test for invalid room codes
  - **Property 3: Invalid Room Code Error Handling**
  - **Validates: Requirements 3.3**

- [ ]* 5.3 Write property test for room cleanup
  - **Property 4: Room Code Cleanup**
  - **Validates: Requirements 3.5**
-

- [x] 6. Update Find Players Screen UI




  - Add "Create Battle Room" section with room code display
  - Add "Join Battle Room" section with code input field
  - Update nearby players list to show room codes
  - Add fallback message for no players found
  - Improve overall UI styling with blur effects and gradients
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 11.1, 11.2_

- [ ]* 6.1 Write property test for beast selection persistence
  - **Property 5: Beast Selection Persistence**
  - **Validates: Requirements 4.5**
-

- [x] 7. Enhance Nearby Connections Integration




  - Update battle invitation payload to include room code
  - Modify invitation handler to extract room code
  - Update challenge flow to create room and share code
  - Add error handling for connection failures
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Write property test for nearby player discovery
  - **Property 6: Nearby Player Discovery Display**
  - **Validates: Requirements 5.3**

- [ ]* 7.2 Write property test for challenge transmission
  - **Property 7: Battle Challenge Transmission**
  - **Validates: Requirements 5.4**

- [ ]* 7.3 Write property test for invitation notifications
  - **Property 8: Battle Invitation Notification**
  - **Validates: Requirements 5.5**

- [x] 8. Implement Real-time Battle Synchronization




  - Create real-time channel setup function
  - Implement move broadcasting via WebSocket
  - Implement move reception and state update handler
  - Add battle state synchronization logic
  - Handle disconnection and reconnection scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 8.1 Write property test for move broadcasting
  - **Property 9: Move Broadcasting**
  - **Validates: Requirements 6.2**

- [ ]* 8.2 Write property test for move reception
  - **Property 10: Move Reception and State Update**
  - **Validates: Requirements 6.3**

- [ ]* 8.3 Write property test for state synchronization
  - **Property 11: Battle State Synchronization**
  - **Validates: Requirements 6.4**

-

- [x] 9. Refactor Battle State Management




  - Update battle initialization to set proper initial state
  - Implement damage calculation with elemental effectiveness
  - Implement turn switching logic with timer reset
  - Add win condition detection (health <= 0)
  - Ensure battle state persistence to database
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.1 Write property test for battle initialization
  - **Property 12: Battle Initialization**
  - **Validates: Requirements 7.1**

- [ ]* 9.2 Write property test for move execution correctness
  - **Property 13: Move Execution Correctness**
  - **Validates: Requirements 7.2**

- [ ]* 9.3 Write property test for turn switching
  - **Property 14: Turn Switching**
  - **Validates: Requirements 7.3**

- [ ]* 9.4 Write property test for win condition detection
  - **Property 15: Win Condition Detection**
  - **Validates: Requirements 7.4**

- [ ]* 9.5 Write property test for state persistence
  - **Property 16: Battle State Persistence**
  - **Validates: Requirements 7.5**
-

- [x] 10. Integrate PeraWallet




  - Add PeraWallet connection button to create wallet screen
  - Implement PeraWallet initialization
  - Implement wallet connection handler
  - Store wallet address securely in SecureStore
  - Create/update user profile on successful connection
  - Add disconnect functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 10.1 Write property test for wallet address storage
  - **Property 17: PeraWallet Connection Success**
  - **Validates: Requirements 8.4**

- [ ]* 10.2 Write property test for user profile creation
  - **Property 18: User Profile Creation on Wallet Connection**
  - **Validates: Requirements 8.5**

- [ ]* 10.3 Write unit tests for PeraWallet integration
  - Test connection success scenario
  - Test connection failure scenario
  - Test disconnect functionality
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 11. Update Battle Arena Screen





  - Subscribe to real-time channel on mount
  - Update UI to show opponent moves in real-time
  - Enable/disable ability buttons based on turn
  - Implement turn timer with auto-skip
  - Display winner and navigation options on battle end
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.1 Write property test for battle arena UI updates
  - **Property 19: Battle Arena UI Updates**
  - **Validates: Requirements 9.2**

- [ ]* 11.2 Write property test for turn control enablement
  - **Property 20: Turn Control Enablement**
  - **Validates: Requirements 9.3**

- [ ]* 11.3 Write property test for turn timer expiration
  - **Property 21: Turn Timer Expiration**
  - **Validates: Requirements 9.4**


- [x] 12. Implement Error Handling and Fallbacks





  - Add network error handling with retry logic
  - Add beast data validation before battle initiation
  - Implement invalid room code feedback
  - Add permission denial handling with educational dialogs
  - Implement real-time connection failure handling
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 12.1 Write property test for invalid room code feedback
  - **Property 22: Invalid Room Code Feedback**
  - **Validates: Requirements 10.3**

- [ ]* 12.2 Write unit tests for error scenarios
  - Test network error handling
  - Test beast data validation
  - Test permission denial handling
  - Test connection failure handling
  - _Requirements: 10.1, 10.2, 10.4, 10.5_
-

- [x] 13. Enhance UI/UX Across All Screens




  - Apply consistent styling with blur effects and gradients
  - Ensure battle room information is clearly displayed
  - Add health bars, energy bars, and turn indicators to battle UI
  - Implement loading indicators for all async operations
  - Add clear call-to-action buttons throughout
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 13.1 Write property test for battle room display completeness
  - **Property 23: Battle Room Display Completeness**
  - **Validates: Requirements 11.2**

- [ ]* 13.2 Write property test for battle UI elements
  - **Property 24: Battle UI Element Presence**
  - **Validates: Requirements 11.3**

- [ ]* 13.3 Write property test for loading indicators
  - **Property 25: Loading State Indicators**
  - **Validates: Requirements 11.4**

- [ ]* 13.4 Write property test for action buttons
  - **Property 26: Action Button Availability**
  - **Validates: Requirements 11.5**

- [x] 14. Update Supabase Configuration





  - Update Supabase client with new database URL and anon key
  - Configure real-time subscriptions
  - Test database connection
  - Verify all queries work with new schema
  - _Requirements: 1.1, 1.2, 1.3_

-

- [x] 15. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Integration Testing
  - Test complete battle flow from creation to completion
  - Test PeraWallet connection and user profile creation
  - Test real-time synchronization between two clients
  - Test nearby connections discovery and invitation
  - _Requirements: All_

- [ ]* 17. Manual Testing on Physical Devices
  - Test on iOS device
  - Test on Android device
  - Test nearby connections between two physical devices
  - Test PeraWallet connection on both platforms
  - Verify UI responsiveness and animations
  - _Requirements: All_
-

- [x] 18. Documentation and Cleanup




  - Update README with new features and setup instructions
  - Document PeraWallet integration steps
  - Document room code system usage
  - Remove any commented-out quest code
  - Clean up unused imports and dependencies
  - _Requirements: All_
