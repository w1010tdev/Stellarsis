# Stellarsis Wiki - Detailed Feature Documentation

## 1. User Authentication & Profile Management

### 1.1 Login & Logout
- **Feature Description**: Users can securely log in and out of the system
- **How to Use**: Access the `/login` page, enter credentials, and click login
- **Security Features**: Password verification (in demo mode, should use hashing in production)

### 1.2 Change Password
- **Feature Description**: Users can change their login password
- **How to Use**: Go to Settings page (`/settings`) and select "Change Password"
- **Security Requirement**: Must enter current password for verification

### 1.3 Profile Settings
- **Feature Description**: Users can set nickname, name color, and badge
- **How to Use**: Go to Settings page (`/settings`) and select "Profile"
- **Customization Options**:
  - Nickname: Display name in chat and forum
  - Color: Color of username display (hex format)
  - Badge: Identity marker

## 2. Chat System

### 2.1 Chat Room Browsing
- **Feature Description**: Users can view chat rooms they have permission to access
- **How to Use**: Visit `/chat` page, system displays rooms user has access to
- **Permission Info**: Users only see authorized chat rooms

### 2.2 Chat Room Participation
- **Feature Description**: Send and receive messages in specific chat rooms
- **How to Use**: Click chat room name to enter, use message input to send
- **Message Format**: Supports Markdown syntax including bold, italic, code blocks, etc.
- **Real-time Communication**: Uses Socket.IO for real-time messaging

### 2.3 Message Management
- **Feature Description**: Users can delete their own messages (permission 777) or any messages (permission su)
- **How to Use**: Click delete button next to message
- **Permission Control**:
  - `su`: Can delete any message
  - `777`: Can only delete own messages
  - `444`: Read-only
  - `Null`: No access

### 2.4 Chat Room Creation & Management (Admin)
- **Feature Description**: Admins can create, edit, delete chat rooms
- **How to Use**: In admin panel (`/admin/chat`) perform operations
- **Permission Assignment**: Can assign different chat room permissions to users

## 3. Forum System

### 3.1 Forum Section Browsing
- **Feature Description**: Users can view forum sections they have permission to access
- **How to Use**: Visit `/forum` page, system displays sections user has access to

### 3.2 Posting & Replying
- **Feature Description**: Create threads and replies in forum sections
- **How to Use**:
  - Post: Click section then click "New Post" button
  - Reply: Use reply box on thread page
- **Permission Control**: Only users with permission 777 or su can post and reply

### 3.3 Thread Management
- **Feature Description**: Users can delete their own threads (permission 777) or any threads (permission su)
- **How to Use**: Click delete button on thread page
- **Permission Info**: Admins have all permissions

### 3.4 Forum Section Management (Admin)
- **Feature Description**: Admins can create, edit, delete forum sections
- **How to Use**: In admin panel (`/admin/forum`) perform operations
- **Permission Assignment**: Can assign different section permissions to users

## 4. User Following System

### 4.1 Follow Users
- **Feature Description**: Follow specific users, receive notification when followed users come online
- **How to Use**:
  - Method 1: In Settings page (`/settings/follows`) search and follow users
  - Method 2: In Online User List click follow button
- **Notification Mechanism**: System broadcasts notification to followers when followed user comes/goes offline

### 4.2 Follow List Management
- **Feature Description**: View and manage your follow list
- **How to Use**: Visit `/settings/follows` page
- **Operations**: Can unfollow, view follow time, etc.

## 5. Permission Management System

### 5.1 Permission Level Descriptions
- **su (Super User)**: Has all permissions, can manage all content
- **777 (Advanced User)**: Can send messages/posts, can delete own content
- **444 (View User)**: Can only view content, cannot send
- **Null (No Access)**: Cannot access the resource

### 5.2 Permission Assignment
- **Feature Description**: Admins can assign different resource permissions to users
- **How to Use**: In admin panel select user, then assign chat room or forum section permissions
- **Auto Permissions**: Admins automatically have su permissions for all resources

## 6. Admin Panel

### 6.1 System Overview
- **Feature Description**: Displays system statistics including user count, online count, message count, etc.
- **How to Use**: Visit `/admin` page

### 6.2 User Management
- **Feature Description**: Manage all users including create, edit, delete users
- **How to Use**: Visit `/admin/users` page
- **Bulk Import**: Supports importing users via CSV file

### 6.3 Chat Management
- **Feature Description**: Manage chat rooms and chat messages
- **How to Use**: Visit `/admin/chat` page
- **Message Cleanup**: Can clean messages by time or room

### 6.4 Forum Management
- **Feature Description**: Manage forum sections and posts
- **How to Use**: Visit `/admin/forum` page
- **Content Management**: Can delete posts and replies

### 6.5 System Tools
- **Feature Description**: Provides system maintenance tools
- **Available Tools**:
  - System log viewing
  - Database backup
  - System optimization
  - Server restart/shutdown
  - Source code download
  - Database download

### 6.6 File Management
- **Feature Description**: Admins can directly edit server files
- **How to Use**: Visit `/admin/file_manager` page
- **Security Restrictions**: Prevents editing dangerous file types

## 7. Frontend Features

### 7.1 Real-time Notification System
- **Feature Description**: Real-time display of user online/offline, new messages, etc.
- **Implementation**: Uses Socket.IO for real-time communication
- **Unread Counts**: Shows unread message counts for chat rooms and forum sections

### 7.2 Theme Switching
- **Feature Description**: Users can switch between different interface themes
- **How to Use**: Click theme switch button in top-right corner
- **Available Themes**: Multiple preset themes provided

### 7.3 Command Palette
- **Feature Description**: Command palette for quick access to system functions
- **How to Use**: Press `Ctrl+K` or `Cmd+K` to open command palette
- **Available Commands**: Navigate to different pages, perform common operations

### 7.4 Responsive Design
- **Feature Description**: Adapts to different device screen sizes
- **Implementation**: Uses CSS media queries and flexible layouts
- **User Experience**: Good experience on both desktop and mobile devices

## 8. Security Features

### 8.1 Input Validation
- **Feature Description**: Validates and sanitizes all user inputs
- **Protection Measures**: XSS protection, SQL injection protection
- **Content Filtering**: Restricts dangerous HTML tags

### 8.2 Permission Validation
- **Feature Description**: Ensures users can only access authorized resources
- **Validation Mechanism**: Verifies user permissions on each request
- **Access Control**: Fine-grained access control strategy

### 8.3 Logging
- **Feature Description**: Records system operations and admin activities
- **Log Types**: System logs, admin operation logs
- **Security Audit**: Facilitates security auditing and troubleshooting