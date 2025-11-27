# GuideSignal Social Platform Expansion Plan

## Goals
- Transform the existing job-focused experience into a networked platform where talent, recruiters, and mentors can connect, share updates, and grow communities.
- Preserve the current authentication and role model while extending capabilities for networking, content sharing, and safety.

## Core Product Pillars
1. **Profiles & Identity**
   - Rich profiles with bios, skills, links, and portfolio media.
   - Role-aware badges (student, job seeker, recruiter) and verification workflows.
   - Public/Private profile visibility controls.

2. **Connections & Graph**
   - Follow model for asymmetric relationships with activity feeds.
   - Optional mutual connections for tighter collaboration (mentorship, hiring pipelines).
   - Recommendations (people you may know, suggested mentors/recruiters) leveraging existing AI matching.

3. **Content & Engagement**
   - Posts with text, links, and attachments; threaded comments and reactions.
   - Topic tags for discovery; hashtag search and saved searches.
   - Job-related content templates (interview stories, portfolio drops, hiring updates).

4. **Messaging & Collaboration**
   - Direct messages with presence indicators and lightweight file sharing.
   - Contextual chat rooms tied to jobs, cohorts, or events.
   - Safety tooling: spam detection, abuse reporting, and block lists.

5. **Opportunities & Hiring**
   - Job posts enriched with skills, salary bands, and application CTAs.
   - AI match scores surfaced in feeds and user profiles.
   - Referral tracking and recruiter pipelines with stages.

6. **Trust, Safety, and Compliance**
   - Strong auth: multi-factor login, session management, and device history.
   - Moderation queue for user-generated content; rate limiting for actions.
   - Privacy-first defaults, transparent data export/delete, and audit logging.

## Technical Roadmap
- **Phase 1: Foundations (Auth + Data Model)**
  - Finalize Firebase/Firestore schemas for profiles, follows, posts, comments, messages, and reports.
  - Add client-side SDK layer for the new collections and access rules.
  - Harden auth flows (email verification, password reset UX, MFA hooks).

- **Phase 2: Social Surfaces**
  - Build profile pages and editable settings with image uploads (Storage).
  - Implement follow/unfollow and personalized home feed (Firestore queries + AI ranking).
  - Create posting UI with markdown-lite editor and attachment uploads.

- **Phase 3: Engagement & Safety**
  - Roll out comments, reactions, and notifications (web + email) with rate limits.
  - Add reporting/blocking flows and moderation dashboard.
  - Ship messaging MVP with presence and typing indicators.

- **Phase 4: Growth & Insights**
  - Recommendation engine for people/jobs/groups using existing AI modules.
  - Analytics dashboards for post reach, connection growth, and hiring funnels.
  - A/B testing harness for onboarding and feed ranking tweaks.

## Infrastructure & Tooling
- CI checks for linting, accessibility, and integration tests for auth flows.
- Feature flag system to safely roll out social features.
- Backup/restore playbooks for Firestore and Storage.

## KPIs
- Activation: % of new users completing profile and following 5+ accounts.
- Engagement: weekly active users, posts per user, comment/like rates.
- Hiring: applications started from feed, recruiter response time, offer rate.
- Safety: report resolution time, spam detection accuracy, blocked user trends.

## Next Steps
- Prioritize schema design and security rules for social collections.
- Build profile + follow MVP behind a feature flag.
- Add auth coverage tests for sign-up/sign-in regressions.
