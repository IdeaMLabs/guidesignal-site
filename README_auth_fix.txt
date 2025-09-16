# GuideSignal Auth Fixes

This patch addresses several issues in the `auth-optimized.js` script used by `auth.html` in the GuideSignal website.  Without these fixes, the signup process fails because the script references DOM elements that do not exist, fails to capture the selected role correctly, and passes the wrong role strings to Firebase.

## Fixes included

* **Terms checkbox ID:** The HTML uses `id="terms"` for the terms‐of‐service checkbox, but `auth-optimized.js` incorrectly looks for `terms-agreement`.  The patch updates all references to use `terms`.
* **Signup button ID:**  The signup form uses a button with `id="create-account-btn"`, but the script expects `signup-btn`.  The patch updates the script to use `create-account-btn` so it can enable/disable the correct button and show loading states.
* **Role selection:**  The original script tried to read `data-role` from the role labels, but the HTML doesn’t define this attribute.  The patch sets `selectedRole` to the `value` of the selected radio input instead and synchronizes this value with the hidden input `selected-role`.  It also uses this value when determining the welcome message.
* **Role normalization:**  Firebase’s `USER_ROLES` enum uses a hyphen (e.g. `job-seeker`), while the radio value uses an underscore (`job_seeker`).  Before calling `authFunctions.registerUser`, the patch normalizes the role string by replacing underscores with hyphens.
* **Validation improvements:**  The patch updates role and terms validations to correctly detect whether a role is selected (`hasRole = !!selectedRole`) and whether the terms checkbox is checked.

## Files in this package

- **auth_optimized_patch.diff** – A unified diff that can be applied to `assets/auth-optimized.js` to implement the fixes.
- **README_auth_fix.txt** (this file) – Instructions for applying the patch and a summary of the changes.

## Applying the patch

If you are using Git, you can apply the diff directly from the project root:

```sh
git apply auth_optimized_patch.diff
```

After applying the patch, rebuild or redeploy the site.  Users should now be able to select a role, agree to the terms, and successfully create an account.  Make sure to test the signup flow by creating a new user and signing in with the newly created credentials.

If you are not using Git, open `assets/auth-optimized.js` and make the following changes manually:

1. **Role selection**
   - In `setupRoleSelection`, set `selectedRole` to `this.value` (the radio input’s value) instead of reading `option.dataset.role`.
   - Update the hidden input `selected-role` with the selected value.
   - Set `roleType = selectedRole` when showing the role confirmation message.

2. **Terms checkbox**
   - Replace all occurrences of `terms-agreement` with `terms`.

3. **Signup button**
   - Replace all occurrences of `signup-btn` with `create-account-btn`.
   - Ensure calls to `setLoading()` pass `'create-account-btn'` when handling the signup form.

4. **Normalize role**
   - Before calling `authFunctions.registerUser(...)`, normalize the selected role string:
     ```js
     const normalizedRole = selectedRole ? selectedRole.replace('_', '-') : selectedRole;
     ```
   - Pass `normalizedRole` to `registerUser()` instead of `selectedRole`.

5. **Validation logic**
   - Update `hasRole` checks to use `const hasRole = !!selectedRole` in `validateSignUpButton`.

After these updates, the signup process should work end‑to‑end.
