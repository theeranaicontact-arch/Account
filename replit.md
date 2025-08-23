# Personal Finance Tracker

## Overview

A full-stack personal finance tracking application built with React and Express that allows users to manage income and expense transactions. The system categorizes financial transactions into predefined types (income: regular, side, investment, other, tax-exempt; expenses: essential, discretionary, debt, savings, other) and provides reporting capabilities. The application syncs data with Airtable for external storage and backup, while maintaining local storage for immediate operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Custom component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod schema validation
- **Styling**: Tailwind CSS with CSS variables for theming support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for transaction CRUD operations
- **Data Validation**: Zod schemas shared between frontend and backend
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Storage Solutions
- **Primary Storage**: In-memory storage (MemStorage class) for development and testing
- **Database Schema**: PostgreSQL schema defined with Drizzle ORM
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Transaction Model**: Supports debit/credit amounts, transaction types, dates, notes, and Airtable synchronization IDs

### External Dependencies
- **Airtable Integration**: Bidirectional sync with Airtable base for data backup and external access
- **Database**: Neon PostgreSQL for production data persistence
- **UI Framework**: Radix UI for accessible component primitives
- **Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: tsx for TypeScript execution, various Replit plugins for development environment integration

### Key Design Decisions
- **Dual Storage Strategy**: Local memory storage for immediate operations with Airtable sync for persistence ensures fast user experience while maintaining data durability
- **Shared Schema**: Common TypeScript schemas between frontend and backend eliminate type mismatches and reduce development overhead
- **Transaction Categories**: Predefined transaction types with tax implications support both personal finance tracking and tax reporting requirements
- **Component Architecture**: Shadcn/ui pattern provides consistent, accessible, and customizable UI components while maintaining design system coherence