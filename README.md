<div align="center">
  <img src="https://via.placeholder.com/120x120/0891b2/ffffff?text=🧠" alt="Academic Buddy Logo" width="120" height="120">
  
  # 🧠 Academic Buddy
  
  **The Ultimate Productivity Platform for Students & Academics**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  
  [🚀 Live Demo](#) • [📖 Documentation](./docs/README.md) • [🐛 Report Bug](#) • [💡 Request Feature](#)
  
</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Installation](#️-installation)
- [🔧 Configuration](#-configuration)
- [📊 Database Setup](#-database-setup)
- [🎯 Usage Guide](#-usage-guide)
- [🔌 API Documentation](#-api-documentation)
- [🎨 UI Components](#-ui-components)
- [📱 Mobile Support](#-mobile-support)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 📚 **Project Management**
- **Kanban Board**: Visual task management with drag-and-drop functionality
- **Table View**: Comprehensive project overview with sorting and filtering
- **Calendar View**: Timeline visualization for deadlines and milestones
- **Priority System**: Color-coded priority levels (Low, Medium, High, Urgent)
- **Status Tracking**: Real-time project status updates

### ⏰ **Focus & Time Management**
- **Pomodoro Timer**: Customizable focus sessions with break intervals
- **Stopwatch Mode**: Free-form time tracking for flexible work sessions
- **Session Analytics**: Detailed insights into productivity patterns
- **Task Integration**: Connect focus sessions directly to specific tasks
- **Audio Notifications**: Customizable sound alerts for session transitions

### 📊 **Analytics & Insights**
- **Productivity Dashboard**: Comprehensive overview of work patterns
- **Time Tracking**: Detailed analysis of time spent on different activities
- **Goal Progress**: Visual progress tracking for projects and tasks
- **Performance Metrics**: Weekly, monthly, and yearly productivity reports
- **Trend Analysis**: Identify peak productivity hours and patterns

### 🎯 **Task Management**
- **Smart Task Creation**: Quick task entry with intelligent categorization
- **Due Date Management**: Automated reminders and deadline tracking
- **Tag System**: Flexible organization with custom tags
- **Subtask Support**: Break down complex tasks into manageable steps
- **Progress Tracking**: Visual progress indicators for all tasks

### 🔐 **Authentication & Security**
- **Firebase Authentication**: Secure user management with multiple providers
- **Protected Routes**: Role-based access control
- **Data Encryption**: Secure storage of sensitive information
- **Session Management**: Automatic session handling and refresh

---

## 🏗️ Architecture

### **Tech Stack**

```mermaid
graph TB
    A[Next.js 15.5.2] --> B[React 19.1.0]
    A --> C[TypeScript 5.0]
    A --> D[Tailwind CSS 4.0]
    
    E[Database Layer] --> F[PostgreSQL]
    E --> G[Prisma ORM 6.16.2]
    
    H[Authentication] --> I[Firebase Auth]
    
    J[UI Components] --> K[Radix UI]
    J --> L[Lucide Icons]
    J --> M[Recharts]
    
    N[State Management] --> O[React Hooks]
    N --> P[Context API]
```

### **Project Structure**

```
academic-buddy/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 api/               # API Routes
│   │   ├── 📁 dashboard/         # Dashboard pages
│   │   ├── 📁 focus/             # Focus session pages
│   │   ├── 📁 projects/          # Project management
│   │   └── 📁 tasks/             # Task management
│   ├── 📁 components/            # Reusable UI components
│   │   ├── 📁 analytics/         # Analytics components
│   │   ├── 📁 focus/             # Focus session components
│   │   ├── 📁 layout/            # Layout components
│   │   ├── 📁 projects/          # Project components
│   │   └── 📁 tasks/             # Task components
│   ├── 📁 contexts/              # React contexts
│   ├── 📁 hooks/                 # Custom React hooks
│   └── 📁 lib/                   # Utility functions
├── 📁 prisma/                    # Database schema
├── 📁 docs/                      # Documentation
└── 📁 public/                    # Static assets
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18.0 or higher
- npm, yarn, or pnpm
- PostgreSQL database
- Firebase project (for authentication)

### **1-Minute Setup**

```bash
# Clone the repository
git clone https://github.com/your-username/academic-buddy.git
cd academic-buddy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up the database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## ⚙️ Installation

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/your-username/academic-buddy.git
cd academic-buddy
```

### **Step 2: Install Dependencies**

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### **Step 3: Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/academic_buddy"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Application
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

---

## 🔧 Configuration

### **Firebase Setup**

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Copy the configuration keys to your `.env.local` file

### **Database Configuration**

1. Set up a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env.local` file
3. Run Prisma migrations:

```bash
npx prisma generate
npx prisma db push
```

### **Optional: Seed Database**

```bash
npx prisma db seed
```

---

## 📊 Database Setup

### **Schema Overview**

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Authentication and profile management
- **Project**: Project organization and tracking
- **Task**: Individual task management
- **FocusSession**: Pomodoro and focus session tracking
- **Tag**: Flexible categorization system
- **Analytics**: Performance and productivity metrics

### **Database Commands**

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db reset
```

---

## 🎯 Usage Guide

### **Getting Started**

1. **Sign Up**: Create an account using email/password
2. **Create Your First Project**: Set up a project to organize your work
3. **Add Tasks**: Break down your project into manageable tasks
4. **Start Focus Sessions**: Use the Pomodoro timer to maintain productivity
5. **Track Progress**: Monitor your productivity through the analytics dashboard

### **Key Workflows**

#### **Project Management**
```
Create Project → Add Tasks → Set Priorities → Track Progress → Complete
```

#### **Focus Sessions**
```
Select Task → Choose Timer Mode → Start Session → Take Breaks → Review Analytics
```

#### **Task Organization**
```
Create Task → Add Tags → Set Due Date → Link to Project → Track Completion
```

---

## 🔌 API Documentation

### **Authentication Endpoints**

```typescript
// Sync user with Firebase
POST /api/auth/sync-user
Body: { firebaseUid: string, email: string, name?: string }
```

### **Project Endpoints**

```typescript
// Get all projects
GET /api/projects

// Create new project
POST /api/projects
Body: { title: string, description?: string, priority: Priority }

// Update project
PUT /api/projects/[id]
Body: Partial<Project>

// Delete project
DELETE /api/projects/[id]
```

### **Task Endpoints**

```typescript
// Get all tasks
GET /api/tasks

// Create new task
POST /api/tasks
Body: { title: string, projectId?: string, priority: Priority }

// Update task
PUT /api/tasks/[id]
Body: Partial<Task>

// Delete task
DELETE /api/tasks/[id]
```

### **Focus Session Endpoints**

```typescript
// Get focus sessions
GET /api/focus-sessions

// Create focus session
POST /api/focus-sessions
Body: { duration: number, taskId?: string, type: 'POMODORO' | 'STOPWATCH' }
```

### **Tag Endpoints**

```typescript
// Get all tags
GET /api/tags

// Create new tag
POST /api/tags
Body: { name: string, color: string }

// Update tag
PUT /api/tags/[id]
Body: Partial<Tag>

// Delete tag
DELETE /api/tags/[id]
```

---

## 🎨 UI Components

### **Design System**

The application uses a consistent design system built with:

- **Color Palette**: Slate and cyan-based theme for professional appearance
- **Typography**: Geist font family for optimal readability
- **Spacing**: Consistent 8px grid system
- **Components**: Radix UI primitives with custom styling

### **Key Components**

#### **Layout Components**
- `AppLayout`: Main application wrapper with sidebar navigation
- `Sidebar`: Collapsible navigation with route highlighting
- `Header`: Top navigation with user profile and notifications

#### **Project Components**
- `ProjectBoard`: Kanban-style project management
- `ProjectTable`: Tabular view with sorting and filtering
- `ProjectCalendar`: Timeline view for project planning
- `ProjectForm`: Create and edit project modal

#### **Focus Components**
- `CircularTimer`: Visual countdown timer
- `TimerControls`: Play, pause, reset controls
- `SessionCompleteModal`: Session completion feedback
- `TaskSelector`: Link sessions to specific tasks

#### **Analytics Components**
- `OverviewAnalytics`: Dashboard summary cards
- `DayAnalytics`: Daily productivity breakdown
- `WeekAnalytics`: Weekly performance charts
- `MonthAnalytics`: Monthly trend analysis

---

## 📱 Mobile Support

### **Responsive Design**

The application is fully responsive and optimized for:

- **Desktop**: Full-featured experience with multi-column layouts
- **Tablet**: Adapted layouts with touch-friendly interactions
- **Mobile**: Streamlined interface with bottom navigation

### **Mobile Features**

- Touch-optimized timer controls
- Swipe gestures for task management
- Responsive navigation menu
- Optimized form inputs for mobile keyboards

### **PWA Support**

The application includes Progressive Web App features:

- Offline functionality for core features
- Install prompt for mobile devices
- Background sync for data updates
- Push notifications for reminders

---

## 🧪 Testing

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### **Testing Strategy**

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Full user workflow testing
- **Visual Tests**: Component snapshot testing

---

## 🚀 Deployment

### **Vercel Deployment (Recommended)**

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t academic-buddy .
docker run -p 3000:3000 academic-buddy
```

### **Environment Variables for Production**

```env
# Production Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Firebase Production Config
NEXT_PUBLIC_FIREBASE_API_KEY="prod-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="prod-domain.firebaseapp.com"
# ... other Firebase config

# Security
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### **Code Style**

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Use semantic commit messages

### **Pull Request Process**

1. Ensure all tests pass
2. Update documentation as needed
3. Add a clear description of changes
4. Link related issues
5. Request review from maintainers

---

## 📚 Additional Resources

### **Documentation**

- [Getting Started Guide](./docs/getting-started.md)
- [Project Management](./docs/projects.md)
- [Focus Sessions](./docs/focus-sessions.md)
- [Analytics](./docs/analytics.md)
- [Tips and Tricks](./docs/tips-and-tricks.md)
- [Troubleshooting](./docs/troubleshooting.md)

### **Community**

- [Discord Server](#) - Join our community
- [GitHub Discussions](#) - Ask questions and share ideas
- [Twitter](#) - Follow for updates

### **Support**

- [Issue Tracker](#) - Report bugs and request features
- [Email Support](#) - Direct support for critical issues
- [Documentation](#) - Comprehensive guides and tutorials

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js
- [Firebase](https://firebase.google.com/) - Authentication and hosting
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

<div align="center">
  
  **Built with ❤️ for students and academics worldwide**
  
  [⭐ Star this repo](https://github.com/your-username/academic-buddy) • [🐛 Report Bug](#) • [💡 Request Feature](#)
  
</div>