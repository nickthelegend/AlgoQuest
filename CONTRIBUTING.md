# Contributing to AlgoQuest

Thank you for your interest in contributing to AlgoQuest! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Git
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AlgoQuest.git
   cd AlgoQuest
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/nickthelegend/AlgoQuest.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

Run the SQL schema in your Supabase project:

```bash
# Copy contents of schema.sql to Supabase SQL Editor and execute
```

### 4. Start Development Server

```bash
npm start
```

## Project Structure

```
AlgoQuest/
├── app/                    # Screen components and navigation
│   ├── (game)/            # Battle system screens
│   ├── (tabs)/            # Main tab navigation
│   └── beast/             # Beast management
├── components/            # Reusable UI components
├── lib/                   # Core business logic
│   ├── battleRoom.ts      # Battle room management
│   ├── battleState.ts     # Battle state logic
│   ├── roomCode.ts        # Room code generation
│   ├── peraWallet.ts      # Wallet integration
│   └── __tests__/         # Unit tests
├── context/               # React context providers
├── hooks/                 # Custom React hooks
├── assets/                # Images, fonts, sounds
├── docs/                  # Documentation
└── schema.sql             # Database schema

```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- lib/__tests__/battleRoom.test.ts
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add room code validation"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or updates
- `chore:` - Maintenance tasks

### 5. Keep Your Branch Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

```typescript
// ✅ Good
interface BattleRoom {
  id: string;
  roomCode: string;
  status: 'waiting' | 'active' | 'completed';
}

async function createBattleRoom(params: CreateBattleParams): Promise<BattleRoom> {
  // Implementation
}

// ❌ Bad
function create(p: any): any {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// ✅ Good
interface RoomCodeDisplayProps {
  code: string;
  onCopy?: () => void;
}

export function RoomCodeDisplay({ code, onCopy }: RoomCodeDisplayProps) {
  // Implementation
}

// ❌ Bad
export function RoomCodeDisplay(props: any) {
  // Implementation
}
```

### File Organization

- One component per file
- Group related files in directories
- Use index files for clean imports
- Keep files under 300 lines when possible

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
  - `battleRoom.ts`, `RoomCodeDisplay.tsx`
- **Components**: PascalCase
  - `BattleArena`, `RoomCodeInput`
- **Functions**: camelCase
  - `generateRoomCode`, `createBattleRoom`
- **Constants**: UPPER_SNAKE_CASE
  - `MAX_RETRIES`, `ROOM_CODE_LENGTH`
- **Interfaces/Types**: PascalCase
  - `BattleRoom`, `CreateBattleParams`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at end of statements
- Use trailing commas in objects/arrays
- Keep lines under 100 characters when possible

```typescript
// ✅ Good
const config = {
  maxRetries: 5,
  timeout: 30000,
};

// ❌ Bad
const config = {
  maxRetries: 5,
  timeout: 30000
}
```

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Business logic
- Data transformations
- Validation functions

```typescript
describe('generateRoomCode', () => {
  it('should generate a 6-character code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('should only use allowed characters', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });
});
```

### Property-Based Tests

Use fast-check for property-based testing:

```typescript
import fc from 'fast-check';

it('should always generate valid codes', async () => {
  await fc.assert(
    fc.asyncProperty(fc.nat(100), async (iterations) => {
      for (let i = 0; i < iterations; i++) {
        const code = generateRoomCode();
        expect(isValidRoomCode(code)).toBe(true);
      }
    }),
    { numRuns: 100 }
  );
});
```

### Integration Tests

Test complete workflows:
- Battle creation and joining
- Real-time synchronization
- Wallet connection

### Test Coverage

- Aim for >80% code coverage
- Focus on critical paths
- Test edge cases and error scenarios

## Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - Update README if needed
   - Add/update inline code comments
   - Update relevant docs in `/docs`

2. **Ensure Tests Pass**
   ```bash
   npm test -- --watchAll=false
   ```

3. **Check Code Quality**
   ```bash
   npm run lint
   ```

4. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## Documentation

### Code Comments

- Add comments for complex logic
- Explain "why" not "what"
- Keep comments up to date

```typescript
// ✅ Good
// Exclude ambiguous characters (0/O, 1/I/L) to prevent user confusion
const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// ❌ Bad
// Define allowed characters
const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Updating dependencies
- Modifying configuration

### Documentation Files

Update relevant docs in `/docs`:
- `BATTLE_SYSTEM.md` - Battle system changes
- `PERAWALLET_INTEGRATION.md` - Wallet integration
- `ROOM_CODE_SYSTEM.md` - Room code system

## Community

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Discord**: Join our community (link coming soon)

### Reporting Bugs

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, device, etc.)

### Suggesting Features

When suggesting features:
- Explain the use case
- Describe the proposed solution
- Consider alternatives
- Discuss potential impact

### Code Review

When reviewing code:
- Be constructive and respectful
- Focus on the code, not the person
- Explain your reasoning
- Suggest improvements
- Approve when satisfied

## Areas for Contribution

### High Priority

- [ ] Battle system optimizations
- [ ] Real-time synchronization improvements
- [ ] Error handling enhancements
- [ ] Test coverage improvements
- [ ] Documentation updates

### Feature Requests

- [ ] Spectator mode for battles
- [ ] Battle replays
- [ ] Tournament system
- [ ] Ranked matchmaking
- [ ] Team battles (2v2, 3v3)

### Good First Issues

Look for issues labeled `good-first-issue`:
- Documentation improvements
- UI enhancements
- Test additions
- Bug fixes

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in project updates

## Questions?

If you have questions not covered here:
- Open a GitHub Discussion
- Reach out to maintainers
- Check existing issues and PRs

---

Thank you for contributing to AlgoQuest! Your efforts help make this project better for everyone. 🎮🐉
