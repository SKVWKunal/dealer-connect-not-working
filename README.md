# Dealer Connect Hub (One Aftersales)

## Overview

**Dealer Connect Hub** (also known as **One Aftersales**) is a comprehensive dealer service management platform designed to streamline and centralize various aftersales operations including:

- **PCC Submissions** - Manage and submit Pre-Commissioning Certificates
- **Workshop Surveys** - Conduct and track workshop performance surveys
- **Warranty Surveys** - Handle warranty-related survey data
- **API Registrations** - Register and manage API integrations
- **MT Meets** - Schedule and coordinate Management Team meetings
- **Technical Awareness** - Share and manage technical documentation and updates

## Technology Stack

This project is built with modern web technologies:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI component library
- **shadcn-ui** - Beautifully designed components
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

Install Node.js using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) for easy version management.

### Local Development

1. **Clone the repository**
   ```sh
   git clone https://github.com/SKVWKunal/dealer-connect-hub.git
   cd dealer-connect-hub
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Start the development server**
   ```sh
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

4. **Lint the code**
   ```sh
   npm run lint
   ```

## Build and Deployment

### Production Build

```sh
npm run build
```

This creates an optimized production build in the `dist` folder.

### Preview Production Build

```sh
npm run preview
```

Preview the production build locally before deployment.

### Development Build

```sh
npm run build:dev
```

Create a development build with additional debugging features.

## Project Structure

```
dealer-connect-hub/
├── src/              # Application source code
├── public/           # Static assets
├── dist/             # Production build output
├── index.html        # HTML entry point
├── vite.config.ts    # Vite configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json      # Project dependencies and scripts
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes and commit with descriptive messages
3. Push your branch and create a pull request
4. Ensure all tests and linting pass

## License

This project is private and proprietary.
