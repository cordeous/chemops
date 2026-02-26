# prompt.md  
## AI Project Orchestration & Full Application Execution Directive

---

# 0. Core Execution Philosophy

This project must be executed with:

- Clear architecture direction
- Explicit integration risk awareness
- Scaling foresight
- Long-term maintainability
- Strict input/output contracts
- Measurable acceptance criteria
- Atomic task decomposition
- Zero ambiguity before implementation

No implementation begins until architecture and constraints are defined.

---

# 1. Application Structure Requirement

Every application MUST follow this workflow:

## 1.1 Landing Page (Marketing Layer)

The application must include a dedicated landing page that:

- Clearly explains all features and functions
- Shows value proposition
- Includes modern UI/UX design
- Uses smooth sliding transitions between sections
- Includes hover effects throughout
- Ensures all buttons are fully functional
- Contains clear call-to-action that routes to the main application

The landing page must feel production-ready, not a placeholder.

## 1.2 Application Layer

After the landing page:

- Route user to the functional application
- Navigation must be intuitive
- No dead links
- All features fully operational

---

# 2. Design Requirements

## 2.1 UI/UX Standards

- Modern, clean layout
- Responsive design
- Fully mobile friendly
- Smooth animations (subtle, not excessive)
- Accessible contrast and readable typography

## 2.2 Mobile Optimization

Application must:

- Work across mobile, tablet, and desktop
- Avoid horizontal scrolling
- Use responsive layouts (flex/grid)
- Optimize touch targets for mobile

Mobile-first thinking is required.

## 2.3 Design Tooling

For designs, use:

- Pencil extension for mockups and UI planning

All designs should be structured before implementation.

---

# 3. Architecture Direction

Before coding, define:

## 3.1 System Type
- Monolith / Modular / Microservices / Serverless
- Justify decision

## 3.2 Core Components
- Frontend framework:
- Backend:
- Database:
- Authentication:
- Hosting environment:
- External APIs:

## 3.3 Data Flow
- Describe request lifecycle
- Define state management
- Define persistence logic
- Define error handling

## 3.4 Tradeoffs
List at least 2 rejected alternatives and explain why.

---

# 4. Integration Risk Analysis

Identify:

## 4.1 Internal Risks
- Breaking API contracts
- Schema changes
- Shared module conflicts

## 4.2 External Risks
- Third-party API failures
- Rate limits
- Dependency version drift

## 4.3 Risk Table

| Risk | Impact | Likelihood | Mitigation | Rollback Plan |
|------|--------|------------|------------|---------------|

---

# 5. Scaling Strategy

Define assumptions:

- Expected user load
- Traffic spikes
- Data growth rate

Plan for:

- Horizontal vs vertical scaling
- Stateless design where possible
- Caching strategy
- Database indexing
- CDN if needed

Identify likely bottlenecks.

---

# 6. Maintainability

## 6.1 Code Structure
- Clear module separation
- Reusable components
- Avoid tight coupling

## 6.2 Testing Strategy
- Unit tests
- Integration tests
- Basic UI tests
- Edge case validation

## 6.3 Observability
- Logging
- Error tracking
- Basic performance monitoring

## 6.4 Documentation
Must include:
- README
- Setup instructions
- Architecture explanation
- Deployment instructions

---

# 7. Input / Output Contracts

Every feature must define:

## Inputs
- Data format
- Validation rules
- Edge cases
- Failure cases

## Outputs
- Response structure
- Error structure
- Status codes
- Side effects

No implicit behavior allowed.

---

# 8. Acceptance Criteria

All criteria must be measurable.

Examples:

- [ ] Landing page fully responsive
- [ ] All buttons functional
- [ ] No console errors
- [ ] Mobile layout verified
- [ ] Application loads under 2 seconds
- [ ] All defined features operational
- [ ] No broken routes
- [ ] Basic error handling implemented

---

# 9. Atomic Task Decomposition

Break into milestones:

## Milestones
- M1: Design mockups (Pencil)
- M2: Landing page implementation
- M3: Core application logic
- M4: Integration & routing
- M5: Testing & optimization
- M6: Deployment

## Atomic Tasks

Each task must:
- Be small (1–2 days max)
- Have clear deliverable
- Be independently testable

Example tasks:

- Create responsive layout grid
- Implement hero section with animation
- Add navigation routing
- Build feature component
- Implement API layer
- Add error handling
- Optimize mobile styling
- Write README
- Final manual testing pass

---

# 10. Ambiguity Removal Checklist

Before coding, confirm:

- Are all features explicitly defined?
- Are UI interactions described?
- Are mobile behaviors defined?
- Are failure states defined?
- Is routing flow defined?
- Are integration dependencies documented?

If unclear, clarify before proceeding.

---

# 11. Deployment Rules

Deployment must follow:

- Use `git add`
- Use `git commit`
- Use `git push`
- Do NOT use GitHub Pages features
- No automated deployment services unless explicitly required

Repository must contain:

- Clean commit history
- Clear README
- Organized file structure

---

# 12. Verification Protocol

Before marking complete:

- Manually test every button
- Test on mobile viewport
- Validate routing behavior
- Check console for errors
- Confirm responsiveness
- Confirm animations function smoothly
- Validate integration points

Never assume correctness. Validate.

---

# 13. AI Execution Instruction

When using AI agents:

- Do not allow coding before architecture is approved.
- Require justification for design choices.
- Require risk identification.
- Require tradeoff explanation.
- Require validation against acceptance criteria.

Execution without clarity is not allowed.