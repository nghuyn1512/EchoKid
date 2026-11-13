# EchoKid - An AI-powered platform supporting parents in understanding and supporting their children's development at home.

EchoKid is an early-stage project developed during hackathons and startup programs. It explores how AI and structured daily observations can help parents better understand their children's behaviors, track changes over time, and access personalized home activity suggestions. The platform focuses on making developmental support more accessible and practical for families, while encouraging collaboration between parents and relevant educational professionals.

> **Our approach:** Observe → Understand → Suggest → Feedback.

---

## The Problem
Supporting a child's development requires consistent attention beyond formal learning or intervention sessions.

However, parents may face several challenges:

- Keeping track of their child's daily behaviors and changes over time.
- Finding suitable activities that align with their child's individual needs.
- Turning general developmental advice into practical activities at home.
- Understanding which approaches are useful and appropriate for their child.
- Maintaining meaningful communication with relevant educational professionals.

EchoKid explores how technology can help make this process more structured, accessible, and manageable for families.

## Our Solution

EchoKid provides a digital platform that helps parents record daily observations, access AI-assisted activity recommendations, and monitor their child's development through a structured dashboard.

The platform combines:

- **Structured child profiles** to organize relevant information about each child.
- **Daily behavior logging** to help parents record observations and contextual information.
- **AI-assisted recommendations** to generate personalized home activity suggestions.
- **Development tracking** to help parents review recorded information over time.
- **Expert connection features** to explore potential collaboration between families and professionals.

EchoKid is designed as a supportive tool, not a replacement for professional assessment, educational intervention, or healthcare services.

## How It Works

The current product workflow is designed around four main stages:

1. **Child Profile:** Parents provide relevant information about their child.
2. **Daily Observation:** Parents record daily behaviors and other relevant observations.
3. **AI-assisted Recommendations:** The system uses available child information and observations to support personalized activity suggestions.
4. **Review and Feedback:** Parents review recommendations, monitor recorded information, and provide feedback where supported.

The goal is to create a structured observation-and-support process that can be refined as more user feedback becomes available.

## Features

Feature availability reflects the current state of the MVP.

| Feature | Status | Description |
|---|---|---|
| Child Profile | Implemented | Organizes relevant information about the child. |
| Daily Behavior Log | Implemented | Allows parents to record daily observations. |
| AI-powered Recommendations | Implemented | Uses Gemini AI to support personalized activity suggestions. |
| Development Dashboard | Implemented | Displays recorded information to help parents monitor their child's development over time. |
| Expert Connection | Partially Implemented | An initial implementation exploring connections between parents and relevant professionals. |
| Parent Feedback | Partially Implemented | Supports parts of the feedback process; a complete feedback-driven recommendation loop is still under development. |
| Community Forum | Planned | A future space for parents to exchange experiences and support one another. |

*Implementation status describes the current prototype and may change as the project evolves.*

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Web application framework |
| TypeScript | Application development |
| Firebase Authentication | User authentication |
| Firestore | Data storage |
| Gemini AI | AI-assisted processing and recommendations |
| Tailwind CSS | UI styling |

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project
- Google OAuth credentials
- A Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/nghuyn1512/EchoKid.git
cd EchoKid
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Add the required configuration:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Status
EchoKid is currently an early-stage MVP developed through hackathon and startup programs.
The team has built an initial working prototype covering core child information management, daily observation logging, AI-assisted recommendations, and development tracking.

The project is now entering a refinement and validation stage. Priorities include:
- Reviewing the product's core assumptions and target users.
- Conducting further research with parents and relevant educational professionals.
- Improving the relevance and usability of activity recommendations.
- Refining the parent feedback process.
- Evaluating the practical value of the platform in real-world family contexts.

## Future Direction
While the initial hackathon prototype explored broader developmental support, future development will prioritize a more focused user segment.
The team is exploring support for parents of children with ADHD, as an initial segment for further product validation.

Planned development areas include:
- Refining the product around specific parent needs and use cases.
- Improving the Activity Catalog and recommendation logic.
- Strengthening the feedback loop between parent observations and recommendations.
- Exploring appropriate collaboration models with schools, educational professionals, and families.
- Further developing expert connection and community support features.
These directions are subject to further research, user feedback, and feasibility assessment.

## Disclaimer
EchoKid is an early-stage supportive technology project. It is not a medical or diagnostic tool.
The platform does not diagnose ADHD or other developmental conditions, prescribe treatment, or replace professional assessment and guidance.
AI-generated suggestions are informational and supportive only. Parents should consult qualified healthcare or educational professionals when they have concerns about their child's development or support needs. 

## Achievements & Recognition
EchoKid has been developed and presented through several innovation, startup, and hackathon programs.
- **Top 40** - RE:ACT 2026
- **Top 25** - RnD to Startup 2026
- **Top 15, University Division** - Build@HUB Hackathon 2026

## Our Team
| Member | Role |
|---|---|
| Tran Thi Ngoc Huyen | Project Manager & Backend Developer |
| Truong Do Nhu Quynh | Frontend Developer & UI/UX |
| Ngo Viet Anh | Data/AI Recommendation Engineer |
| Nguyen Thi Dieu Linh | Business |
| Nguyen Thi Bao Trang | Child Development & Research |
