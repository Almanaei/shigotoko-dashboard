# cursor init 12 - Message Archive System Documentation

## System Overview

The Message Archive System is a specialized component of the Shigotoko Dashboard that provides access to historical team communications. This system has been redesigned to focus exclusively on viewing and exploring archived messages, with no current chat functionality. The archives provide a historical record of all team conversations, organized by month.

## Core Components

1. **Frontend Interface**:
   - Archive browser with month selection dropdown
   - Message display organized by date
   - User identification with avatars and names
   - Empty state handling for months with no archives

2. **Backend Services**:
   - Archive retrieval API endpoints
   - Available months listing API
   - SQL-based data retrieval for compatibility

3. **Database Structure**:
   - `MessageArchive` table with indexed `archiveMonth` field
   - Message content and sender metadata preservation
   - Timestamp data for chronological display

4. **Automation**:
   - Monthly archive creation script
   - Transaction-based archiving for data integrity
   - System notifications for archive creation events

## Implementation Details

### Frontend Archive Interface

The frontend is implemented in `app/messages/page.tsx` as a React component that:

1. Loads available archive months on initial render
2. Fetches messages for a selected month
3. Groups and displays messages by date
4. Provides a month selection dropdown with formatted month names
5. Includes an export button for downloading archive data
6. Handles loading, empty, and error states elegantly

Key functions include:
- `formatArchiveMonth()` - Converts YYYY-MM format to human-readable month names
- `groupMessagesByDate()` - Organizes messages into date-based groups
- `getSenderInfo()` - Resolves sender information from IDs
- `formatMessageTime()` - Provides relative or absolute timestamps

### API Endpoints

The system provides these API endpoints:

1. **GET /api/messages/archives?month=YYYY-MM**
   - Retrieves archived messages for a specific month
   - Returns formatted messages with sender information

2. **GET /api/messages/archives/months**
   - Lists all available archive months
   - Returns months in YYYY-MM format, sorted in descending order

3. **POST /api/messages/archives**
   - Admin-only endpoint for manual archive creation
   - Moves current messages to archive and clears message table

### Database Schema

The `MessageArchive` table schema:

```prisma
model MessageArchive {
  id           String   @id @default(uuid())
  content      String
  senderId     String?
  employeeId   String?  
  senderName   String?
  senderAvatar String?
  timestamp    DateTime
  archiveMonth String   // Format: YYYY-MM
  isEmployee   Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([archiveMonth])
  @@index([timestamp])
}
```

### Automation Script

The `scripts/archive-messages.js` script provides:

1. Monthly automatic archiving via cron job
2. Transaction-based operations for data integrity
3. System message creation to notify users
4. Error handling and logging

## User Experience

The Archive System provides these key user experiences:

1. **Month Selection**:
   - Users can select from available archive months via dropdown
   - Month names are formatted for readability (e.g., "April 2024")

2. **Message Browsing**:
   - Messages are grouped by date with clear date headers
   - Messages display sender name, content, and relative time
   - User avatars are displayed, with fallback to initials

3. **Visual Identity**:
   - Current user's messages are aligned right with blue bubbles
   - Other users' messages are aligned left with gray bubbles
   - User avatars have consistent color coding based on user ID

4. **Status Feedback**:
   - Loading state with spinner during data fetching
   - Empty state with helpful message when no archives exist
   - Error messages for network or server issues

## Technical Considerations

1. **Performance Optimizations**:
   - SQL query optimizations with proper indexes
   - Message grouping for efficient rendering
   - Conditional fetching to prevent unnecessary requests

2. **Compatibility**:
   - Raw SQL queries ensure database compatibility
   - Error handling for non-existent tables
   - Graceful degradation for missing data

3. **Data Integrity**:
   - Transaction-based archiving prevents partial operations
   - Comprehensive error handling and reporting
   - Data validation before display

## Future Enhancements

1. **Search Functionality**:
   - Implement full-text search across archives
   - Add filters for sender, date range, and content

2. **Export Options**:
   - Complete CSV export functionality
   - Add PDF and print options
   - Batch export for multiple months

3. **Archive Management**:
   - Admin controls for manual archive creation
   - Archive deletion options with proper permissions
   - Archive compression for older data

4. **UI Improvements**:
   - Pagination for very large archives
   - Thread visualization for related messages
   - Enhanced mobile responsiveness

## Usage Guide

1. **Accessing Archives**:
   - Navigate to the Messages page in the dashboard
   - Review the list of available archive months in the dropdown

2. **Browsing Messages**:
   - Select a month to view its archived messages
   - Scroll through the chronological message display
   - Messages are grouped by date for easy navigation

3. **Exporting Data**:
   - Click the download icon to export the current month's messages
   - Archives are exported in CSV format for analysis or record-keeping

4. **Admin Functions**:
   - Administrators can create manual archives via API
   - The archiving script runs monthly to maintain archives automatically

## Deployment Notes

To fully deploy the Message Archive System:

1. Ensure database migrations are applied (`npx prisma migrate deploy`)
2. Configure the archive script as a cron job (`0 0 1 * *`)
3. Monitor system performance and database size
4. Implement regular maintenance checks for data integrity

The system is designed to operate with minimal maintenance while providing reliable access to historical communication data. 