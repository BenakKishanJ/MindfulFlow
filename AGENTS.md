# Agent Guidelines for MindfulFlow Mobile App

## Build & Development Commands
- **Start development server**: `expo start`
- **Start on specific platform**: `expo start --android` / `expo start --ios` / `expo start --web`
- **Lint code**: `expo lint`
- **No test framework configured yet**

## Code Style Guidelines

### TypeScript & React
- Use TypeScript with strict mode enabled
- Functional components with `React.FC<PropsType>`
- Define interfaces for all props and complex types
- Use named exports for utilities, default export for components

### Naming Conventions
- **Components**: PascalCase (e.g., `BlinkRateStats`)
- **Functions/Methods**: camelCase (e.g., `formatTime`)
- **Interfaces/Types**: PascalCase (e.g., `AuthContextType`)
- **Variables**: camelCase (e.g., `blinkRate`)

### Imports & File Structure
- Group imports: React → third-party → local modules
- Use path aliases: `@/*` for root directory imports
- One component per file, related types in same file

### Styling
- Prefer NativeWind (Tailwind) classes for components
- Use StyleSheet for complex animations or dynamic styles
- Follow existing color palette from tailwind.config.js

### Error Handling
- Use try/catch blocks for async operations
- Log errors with `console.error()` and re-throw
- Validate user inputs and handle edge cases

### Best Practices
- No comments unless explaining complex business logic
- Keep functions small and focused
- Use proper TypeScript types everywhere