# Migration Plan

## Strategy: Progressive Rollout (Strangler Pattern)
We will introduce the new dashboard pages one by one alongside the existing admin panel, using a feature flag to toggle access for specific admin roles.

## Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Install Tailwind and configure `tailwind.tokens.js`.
- [ ] implement `design_tokens.json` in the build system.
- [ ] Build core layout shell (Sidebar, Header) as a new route `/admin-v2`.

### Phase 2: Core Components (Weeks 3-4)
- [ ] Build `KPICard`, `DataTable`, `SlideOver`, `Button` components.
- [ ] Verify accessibility compliance (Axe, keyboard nav).

### Phase 3: Dashboard & Orders (Weeks 5-6)
- [ ] Implement Dashboard Home (KPIs).
- [ ] Implement Orders List (Read-only first).
- [ ] Implement Order Detail Slide-Over (Write actions).
- *Checkpoint*: Release to internal "Beta Testers" group (Support Leads).

### Phase 4: Product Management (Weeks 7-8)
- [ ] Implement Product List & Editor Modal.
- [ ] Migrate 3D model viewer.
- [ ] Ensure backward compatibility with existing product data structure.

### Phase 5: Full Switchover (Week 9)
- [ ] Direct `/admin` to `/admin-v2`.
- [ ] Deprecate old routes.

---

# Engineering Rollout Checklist (5 Steps)

1. **Setup**: Initialize `/redesign_package` assets in the repo and run `npm install` for any new peer dependencies (e.g., `@headlessui/react`).
2. **Tokens**: Import `tailwind.tokens.js` into `tailwind.config.js` to expose the new design system classes.
3. **Shell**: Create the `AdminLayoutV2.tsx` wrapper and route it to `https://admin-dev.idol-platform.com/v2`.
4. **Pilot**: Build and deploy the "Orders List" page using `DataTable` component. Connect to existing Order API.
5. **Verify**: Run the `usability_test_plan.md` with 3 ops staff on the "Orders List" page. Fix critical blockers before proceeding.
