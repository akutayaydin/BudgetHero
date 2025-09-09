# 🚀 Replit Testing Branch Workflow

### 1. Create a branch

* **GUI:** Git panel → click branch name (`main`) → type new one (e.g. `feature/budget-plan`) → press Enter.
* **Shell:**

  ```bash
  git checkout main
  git checkout -b feature/budget-plan
  ```

---

### 2. Make changes & commit

* Work normally in Replit.
* **GUI:** Stage → add commit message → **Commit**.
* **Shell:**

  ```bash
  git add .
  git commit -m "Checkpoint: budget plan schema + routes"
  ```

---

### 3. Push the branch

* **GUI:** Click **Push**.
* **Shell:**

  ```bash
  git push -u origin feature/budget-plan
  ```

✅ Now the branch exists on GitHub (Codex & others can see it).

---

### 4. Keep working

* Repeat: edit → commit → push.
* Stay on `feature/budget-plan` until testing is complete.

---

### 5. Merge when ready

* **Recommended:** Open a Pull Request on GitHub (`feature/budget-plan → main`) → merge.
* **Shell (quick way):**

  ```bash
  git checkout main
  git pull
  git merge feature/budget-plan
  git push
  ```

---

### 6. Clean up

* Delete branch after merge (optional):

  ```bash
  git branch -d feature/budget-plan
  git push origin --delete feature/budget-plan
  ```

---

✅ Rule of thumb:

* **Commit often** (safe checkpoints in Replit).
* **Push when you want GitHub/Codex to see the branch**.
* **Merge only when the feature is stable**.

---

### TO FIX ERRORS:

* **git status** 
* **git restore --staged client/src/components/overview-dashboard.tsx** 

* **git add client/src/components/overview-dashboard.tsx** 


Do you want me to also add a **“Quick Troubleshooting”** section (like what to do if you see conflicts or can’t push from Replit)?
