# Critical: Real DB Operations & Sync - Analysis & Fix Plan

**Date:** 2026-02-14
**Issue:** Tasks not actually completing/deleting in database

---

## 🔍 Root Cause Analysis (From Logs)

### Issue Found at Line 701:
```
'status': 'error', 'error': 'At least one field (title or description) must be provided'
```

**What's Happening:**
1. Cohere calls `update_task(task_id='20', title='buy dinner')`
2. Backend expects BOTH `old_title` AND `title` for updates
3. Tool returns error status
4. Cohere agent sees error but may still claim success

---

## 🐛 Confirmed Problems

### 1. Update Tool Parameter Mismatch
- Cohere sends: `{task_id: '20', title: 'buy dinner'}`
- Backend expects: `{task_id: '20', old_title: 'make dinner', title: 'buy dinner'}`
- Result: Error "At least one field must be provided"

### 2. Complete/Delete May Have Similar Issues
- Need to verify parameters being passed
- Need to check if commits are actually happening

### 3. Frontend Not Refreshing
- No cache invalidation after tool calls
- Manual refresh also doesn't show changes (suggests DB issue)

---

## ✅ Fix Plan

### Fix 1: Update Tool Parameter Handling

**File:** `backend/tools/task_tools.py`

Make `old_title` optional for updates when `task_id` is provided:

```python
def update_task(session: Session, user_id: str, task_id: str = None,
                old_title: str = None, title: str = None, description: str = None):
    # If task_id is provided, we don't need old_title
    # Just fetch the task and update it
    
    if not task_id and not old_title:
        raise ValueError("Must provide either task_id or old_title")
    
    # Validate at least one field to update
    if title is None and description is None:
        raise ValueError("At least one field (title or description) must be provided")
    
    # Rest of the function...
```

### Fix 2: Add Strong Logging

Add to all tools (complete, delete, update):

```python
print(f"[TOOL] {operation} - task_id={task_id}, user_id={user_id}")
print(f"[TOOL] Before: {task.to_dict()}")
# ... perform operation ...
session.commit()
session.refresh(task)
print(f"[TOOL] After commit: {task.to_dict()}")
print(f"[TOOL] SUCCESS: {operation} completed")
```

### Fix 3: Verify Commits Are Happening

Ensure all tools have:
```python
session.add(task)  # Mark for update
session.commit()   # Commit to DB
session.refresh(task)  # Refresh from DB to confirm
```

### Fix 4: Frontend Cache Invalidation

**File:** `frontend/components/chat/ChatModal.tsx`

```typescript
// After successful chat response with tool calls
if (response.tool_calls && response.tool_calls.length > 0) {
  const hasTaskOperation = response.tool_calls.some(tc => 
    ['add_task', 'complete_task', 'delete_task', 'update_task'].includes(tc.name)
  );
  
  if (hasTaskOperation) {
    // Invalidate tasks query to force refetch
    queryClient.invalidateQueries(['tasks']);
  }
}
```

---

## 🧪 Testing Steps

### Test 1: Verify Tools Work Directly
```bash
# Check backend logs for:
# [TOOL] complete_task - task_id=20, user_id=user-xxx
# [TOOL] Before: {completed: False}
# [TOOL] After commit: {completed: True}
# [TOOL] SUCCESS: complete_task completed
```

### Test 2: Verify DB Changes
```sql
SELECT id, title, completed FROM tasks WHERE user_id = 'user-xxx';
-- Should show completed=true after complete operation
```

### Test 3: Verify Frontend Sync
```
1. Add task via chat
2. Complete task via chat
3. Check /tasks page (should auto-refresh and show completed)
4. No manual refresh needed
```

---

## 📊 Current Status

Based on logs:
- ✅ Tools ARE being called
- ❌ update_task failing due to parameter mismatch
- ❓ complete_task and delete_task status unknown (need to test)
- ❌ Frontend not invalidating cache

---

## 🚀 Next Actions

1. Fix update_task to not require old_title when task_id provided
2. Add comprehensive logging to all tools
3. Test complete_task and delete_task with real operations
4. Add frontend cache invalidation
5. Verify DB commits are actually happening

---

**Priority:** CRITICAL - Users think operations succeed but DB unchanged
