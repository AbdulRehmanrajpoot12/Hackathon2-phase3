# ADR-0003: Floating Chat Icon with Modal UI Pattern

> **Scope**: This ADR documents the decision to implement the chatbot UI as a floating icon with modal dialog rather than a dedicated full-page chat interface.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** phase3-chatbot
- **Context:** The chatbot needs to be accessible from anywhere in the application without disrupting the user's current workflow. Users should be able to quickly ask questions, manage tasks, and return to their previous activity. The UI pattern must balance accessibility, screen real estate, and user experience across desktop and mobile devices.

## Decision

Implement chatbot UI as a floating icon + modal pattern:
- **Floating Icon**: Fixed position bottom-right corner, visible only after login
- **Icon Design**: MessageCircle from lucide-react, blue gradient, hover glow effect, pulse indicator for new messages
- **Modal Dialog**: shadcn/ui Dialog component, 500x600px on desktop, full-screen on mobile
- **State Persistence**: Conversation ID stored in sessionStorage, survives modal close/reopen
- **Global Integration**: Icon and modal integrated into root layout, accessible from all pages

**Implementation Details:**
- Icon: 56x56px (w-14 h-14), z-index 50, fixed bottom-6 right-6
- Modal: DialogContent with flex layout, scrollable message area, fixed input at bottom
- Animations: Tailwind transitions (duration-300), pulse animation for notifications
- Responsive: `sm:max-w-[500px] h-[600px]` on desktop, full viewport on mobile
- Accessibility: ARIA labels, keyboard navigation (Esc to close), focus management

## Consequences

### Positive

- **Non-Disruptive**: Users can access chat without leaving their current page or losing context
- **Always Available**: Floating icon visible from any page after login, no navigation required
- **Quick Interactions**: Modal opens instantly, users can send quick commands and close immediately
- **Screen Real Estate**: Doesn't consume permanent screen space; only appears when needed
- **Mobile Friendly**: Full-screen on mobile provides optimal chat experience on small screens
- **Familiar Pattern**: Common UI pattern (like Intercom, Drift) that users recognize and understand
- **State Preservation**: Closing modal doesn't lose conversation; users can resume anytime

### Negative

- **Discoverability**: New users might not notice the floating icon; requires onboarding or tooltips
- **Screen Clutter**: Icon always visible (when logged in) might feel intrusive to some users
- **Limited Context**: Modal doesn't show full application context; users can't reference other pages while chatting
- **Mobile Keyboard**: On mobile, keyboard can cover significant portion of modal, reducing visible messages
- **Z-Index Conflicts**: Floating icon must have high z-index; potential conflicts with other overlays
- **No Multi-Window**: Can't have chat open in separate window or side-by-side with main content
- **Animation Performance**: Pulse animation and transitions might impact performance on low-end devices

## Alternatives Considered

### Alternative 1: Dedicated Full-Page Chat Interface
- **Pros**: More screen space, better for long conversations, can show rich context, easier to implement, no z-index issues
- **Cons**: Requires navigation away from current page, disrupts workflow, loses context, feels like separate app, not accessible from everywhere
- **Why Rejected**: Forces users to leave their current task to chat. Doesn't fit the "quick assistant" use case. Would reduce chat usage significantly.

### Alternative 2: Sidebar Panel (Slide-out)
- **Pros**: More space than modal, can stay open while browsing, shows more context, familiar pattern (like Slack)
- **Cons**: Pushes main content aside, complex responsive behavior, harder to implement, conflicts with existing sidebar navigation
- **Why Rejected**: Would require redesigning entire layout to accommodate sidebar. Too disruptive to existing UI. Mobile experience would be poor.

### Alternative 3: Bottom Sheet (Mobile-First)
- **Pros**: Native mobile feel, smooth animations, partial visibility, can drag to expand/collapse
- **Cons**: Desktop experience awkward, requires custom implementation, accessibility challenges, inconsistent across devices
- **Why Rejected**: Optimizes for mobile at expense of desktop. Most users are on desktop. Would require significant custom code.

### Alternative 4: Inline Chat Widget (Embedded in Pages)
- **Pros**: Contextual to current page, no overlay, simple implementation, no z-index issues
- **Cons**: Not accessible from all pages, requires adding to every page, inconsistent placement, takes permanent screen space
- **Why Rejected**: Defeats purpose of global assistant. Would need to be added to every page individually. Not scalable.

### Alternative 5: Command Palette (Cmd+K Style)
- **Pros**: Keyboard-first, fast access, no visual clutter, familiar to developers, works on all pages
- **Cons**: Not discoverable for non-technical users, requires keyboard, poor mobile experience, doesn't fit conversational UI
- **Why Rejected**: Too technical for general users. Command palette pattern doesn't work well for multi-turn conversations.

## References

- Feature Spec: specs/features/chatbot.md (User Story 6: Resume Conversation)
- Implementation Plan: specs/phase3-implementation-plan.md (Phase 6: Frontend Chatbot UI Integration)
- UI Spec: specs/ui/chat-interface.md (Floating Chat Icon and Chat Modal sections)
- Integration Spec: specs/integration/frontend-backend.md (Frontend State Management)
- Related ADRs: ADR-0002 (Stateless Server Architecture)
- Evaluator Evidence: history/prompts/constitution/002-phase3-ai-chatbot-cohere-floating-ui.constitution.prompt.md
