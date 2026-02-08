# Permission System Fixes

## Summary

Fixed 5 critical issues in the permission management system:

1. ✅ Permission API format error
2. ✅ Added 444 (read-only) permission support
3. ✅ Dark mode compatibility for permission selectors
4. ✅ Individual permission dropdown for each user
5. ✅ Database table loading error handling

## Issue Details

### Issue 1: Permission Update API Error

**Error Message**: "更新失败: scope 必须为 chat 或 forum"

**Root Cause**: 
- Frontend sent wrong API format: `{ chat_rooms: { roomId: perm } }`
- Backend expected: `{ scope: 'chat', target_id: roomId, perm: value }`

**Fix**:
```javascript
// Before
body: JSON.stringify({
    chat_rooms: { [currentRoom.value.id]: newPerm }
})

// After
body: JSON.stringify({
    scope: 'chat',
    target_id: currentRoom.value.id,
    perm: newPerm
})
```

### Issue 2: Missing 444 Permission Type

**Problem**: System only supported SU, 777, and Null
**Required**: 4 permission types
- SU: Read, write, delete anything
- 777: Read, write, delete own content
- 444: Read only (NEW)
- Null: No access

**Fix**:
- Added `roomUsersBy444` and `sectionUsersBy444` computed properties
- Updated list view from 3 to 4 columns
- Added 444 to permission selectors

### Issue 3: Dark Mode Styling

**Problem**: Hardcoded light mode colors in permission selector

**Fix**: Replaced with CSS variables
```javascript
// Before
background: user.perm === '777' ? '#e6f7ff' : '#f5f5f5'

// After
background: user.perm === '777' 
    ? 'var(--el-color-primary-light-9, #e6f7ff)' 
    : 'var(--el-fill-color-light, #f5f5f5)'
```

### Issue 4: Individual Permission Selection

**Problem**: No way to change individual user permissions directly

**Fix**: Added dropdown selector for each user
```html
<el-select v-model="user.perm" @change="updateUserPermission(user, 'chat', roomId)">
    <el-option label="SU" value="su"></el-option>
    <el-option label="777" value="777"></el-option>
    <el-option label="444" value="444"></el-option>
    <el-option label="Null" value="Null"></el-option>
</el-select>
```

### Issue 5: Database Table Error

**Error**: "请求失败: Unexpected token '<'"

**Root Cause**: API returned HTML error page, but code tried to parse as JSON

**Fix**: Added proper error handling
```javascript
// Check response is OK
if (!response.ok) {
    ElMessage.error(`加载表数据失败: HTTP ${response.status}`);
    return;
}

// Verify content type
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
    ElMessage.error('服务器返回了非JSON响应');
    return;
}
```

## Testing

All fixes have been tested and verified:
- ✅ Permission updates work without errors
- ✅ 444 permission displays correctly
- ✅ Dark mode styling is consistent
- ✅ Individual selectors update permissions
- ✅ Database errors are handled gracefully

## Migration Notes

No database migration needed. All changes are frontend-only and backward compatible.
