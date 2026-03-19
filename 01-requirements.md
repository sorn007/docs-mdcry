# LINE Agent - Requirements Document

> **Version:** 1.4
> **Status:** Draft
> **Last Updated:** 2026-03-19

---

## Table of Contents

1. [Business Requirements](#1-business-requirements)
   - 1.1 [Project Goals](#11-project-goals)
   - 1.2 [Target Users](#12-target-users)
   - 1.3 [Success Metrics](#13-success-metrics)
2. [Functional Requirements](#2-functional-requirements)
   - 2.1 [Core Features](#21-core-features)
   - 2.2 [User Stories](#22-user-stories)
   - 2.3 [Agent Team Capabilities](#23-agent-team-capabilities)
   - 2.4 [User Authentication & Registration](#24-user-authentication--registration)
   - 2.5 [Job Policy System](#25-job-policy-system)
   - 2.6 [Organization Chart & Approval Workflow](#26-organization-chart--approval-workflow)
   - 2.7 [Admin Portal Features](#27-admin-portal-features)
   - 2.8 [Data Source Integration](#28-data-source-integration-google-sheets-api)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Integration Requirements](#4-integration-requirements)
5. [Constraints](#5-constraints)
6. [Assumptions](#6-assumptions)
7. [Open Questions](#7-open-questions)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security Considerations](#9-security-considerations)
10. [Appendix A: LINE Messaging API Reference](#appendix-a-line-messaging-api-reference)
11. [Appendix B: MoSCoW Summary](#appendix-b-moscow-summary)
12. [Appendix C: INVEST Validation](#appendix-c-invest-validation-for-user-stories)

---

## 1. Business Requirements

### 1.1 Project Goals

| Priority | Goal | Description |
|----------|------|-------------|
| **Must** | Unified Interface | สร้าง LINE Bot เป็น single interface สำหรับติดต่อทีม AI Agents |
| **Must** | Agent Routing | ส่งต่อ request ไปยัง Agent ที่เหมาะสมอัตโนมัติ |
| **Should** | Context Preservation | รักษา context ของการสนทนาเพื่อให้ Agents ตอบได้อย่างต่อเนื่อง |
| **Should** | Multi-session Support | รองรับผู้ใช้หลายคนพร้อมกัน |
| **Could** | Rich Experience | ให้ประสบการณ์การใช้งานที่ดีด้วย Flex Messages, Quick Replies |

### 1.2 Target Users

| User Type | Description | Use Cases |
|-----------|-------------|-----------|
| **Primary** | สมาชิกในทีม | สั่งงาน Agents, ตรวจสอบ status, ขอข้อมูล |
| **Secondary** | Stakeholders | ติดตาม progress, รับ reports |
| **Potential** | External Users | ทดสอบระบบ, demo capabilities |

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | < 5 seconds | Time from message received to first response |
| Agent Accuracy | > 90% | Correct agent routing based on intent |
| User Satisfaction | > 4.0/5.0 | User feedback rating |
| Uptime | > 99% | Service availability |
| Message Success Rate | > 99.5% | Successful message delivery |

---

## 2. Functional Requirements

### 2.1 Core Features

#### 2.1.1 Message Handling

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-001 | Receive Messages | **Must** | รับข้อความจาก LINE Users ผ่าน Webhook |
| F-002 | Send Messages | **Must** | ส่งข้อความตอบกลับผู้ใช้ (Reply/Push) |
| F-003 | Message Types | **Must** | รองรับ text, image, sticker, location |
| F-004 | Rich Messages | **Should** | ส่ง Flex Messages สำหรับ structured content |
| F-005 | Quick Replies | **Should** | แสดงตัวเลือกด่วนให้ผู้ใช้ |

#### 2.1.2 Agent Integration

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-010 | Agent Registry | **Must** | Registry ของ Agents ทั้งหมดในทีม |
| F-011 | Intent Detection | **Must** | วิเคราะห์ intent เพื่อ route ไป Agent ที่เหมาะสม |
| F-012 | Agent Handoff | **Must** | ส่งต่อ context ระหว่าง Agents |
| F-013 | Agent Status | **Should** | แสดงสถานะของแต่ละ Agent (available/busy) |
| F-014 | Multi-Agent | **Could** | ให้หลาย Agents ทำงานร่วมกันใน task เดียว |

#### 2.1.3 User Management

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-020 | User Identification | **Must** | ระบุตัวตนผู้ใช้จาก LINE User ID |
| F-021 | Session Management | **Must** | จัดการ session ของแต่ละผู้ใช้ |
| F-022 | User Preferences | **Should** | เก็บ preferences ของแต่ละผู้ใช้ |
| F-023 | Access Control | **Should** | ควบคุมการเข้าถึง Agents บางตัว |

#### 2.1.4 Agent Commands

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-030 | Help Command | **Must** | แสดงวิธีใช้งานและ Agents ที่มี |
| F-031 | Status Command | **Must** | แสดงสถานะระบบและ Agents |
| F-032 | Agent Selection | **Should** | เลือก Agent เฉพาะด้วย prefix/mention |
| F-033 | History | **Could** | ดูประวัติการสนทนา |

### 2.2 User Stories

#### Story Format: As a [user], I want to [action], so that [benefit]

```gherkin
Feature: Agent Communication

US-001: Direct Agent Query
  As a user
  I want to send a message and get it routed to the appropriate agent
  So that I can get help without knowing which agent to contact
  
  Acceptance Criteria:
  - Given I send "ช่วยเขียน requirements หน่อย"
  - When the system processes my message
  - Then it routes to zata (Requirement Analyst)
  - And I receive zata's response in LINE

US-002: Explicit Agent Selection
  As a user
  I want to mention a specific agent by name
  So that I can bypass automatic routing
  
  Acceptance Criteria:
  - Given I send "@jarvis สรุปงานวันนี้"
  - When the system processes my message
  - Then it routes directly to jarvis
  - And I receive jarvis's response

US-003: Multi-turn Conversation
  As a user
  I want to have a continuous conversation with context preserved
  So that I don't have to repeat information
  
  Acceptance Criteria:
  - Given I'm in a conversation with an agent
  - When I send follow-up messages
  - Then the agent has context from previous messages
  - And responses are coherent

US-004: Agent Handoff
  As a user
  I want to be transferred to another agent when needed
  So that I get specialized help
  
  Acceptance Criteria:
  - Given I'm talking to jarvis
  - When jarvis determines zata should handle the request
  - Then the conversation context transfers to zata
  - And zata continues the conversation seamlessly

US-005: Rich Content Response
  As a user
  I want to receive formatted messages with buttons and cards
  So that I can interact easily
  
  Acceptance Criteria:
  - Given an agent generates structured content
  - When the response is sent to LINE
  - Then it renders as Flex Message
  - And I can tap buttons to take actions
```

### 2.3 Agent Team Capabilities

| Agent | Role | Capabilities | LINE Use Cases |
|-------|------|--------------|----------------|
| **jarvis** | Orchestrator | ประสานงาน, สรุป, assign tasks | สรุปงาน, ดู status, มอบหมาย |
| **kim** | Executive Secretary | นัดหมาย, reminder, organize | ตั้งเวลา, เช็คตาราง, remind |
| **zata** | Requirement Analyst | เขียน specs, user stories | เขียน requirements, วิเคราะห์ |
| **uncle** | Solution Architect | ออกแบบระบบ, tech decisions | ปรึกษา architecture, design |
| **ally** | UX/UI Designer | ออกแบบ UI, wireframe | ขอ design, review UI |
| **pichit** | Developer | เขียน code, debug | code review, fix bugs |
| **maeaw** | Specialist | ด้าน specific | ตามความเชี่ยวชาญ |
| **aus** | Specialist | ด้าน specific | ตามความเชี่ยวชาญ |
| **koi** | Specialist | ด้าน specific | ตามความเชี่ยวชาญ |

---

### 2.4 User Authentication & Registration

#### Overview

ระบบยืนยันตัวตนและลงทะเบียนผู้ใช้เพื่อควบคุมการเข้าถึง Job Policies และข้อมูล

#### 2.4.1 Feature Requirements

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-040 | Email OTP Verification | **Must** | ยืนยันตัวตนด้วย OTP ส่งไปอีเมล (API พร้อม) |
| F-041 | Phone OTP Verification | **Must** | ยืนยันตัวตนด้วย OTP ส่งไปโทรศัพท์ (API พร้อม) |
| F-042 | User Registration | **Must** | ลงทะเบียนผู้ใช้ใหม่พร้อมข้อมูลพื้นฐาน |
| F-043 | User Profile Management | **Should** | จัดการข้อมูลโปรไฟล์ (ชื่อ, ตำแหน่ง, แผนก) |
| F-044 | Role Assignment | **Must** | กำหนดบทบาท (Admin, User, Approver) |
| F-045 | Session Authentication | **Must** | จัดการ session หลัง authenticate สำเร็จ |
| F-046 | LINE Account Linking | **Should** | เชื่อม LINE ID กับ User Account |
| F-047 | Multi-factor Auth | **Could** | รองรับ MFA สำหรับบทบาทที่มีสิทธิ์สูง |

#### 2.4.2 User Stories

```gherkin
Feature: User Authentication

US-010: Email OTP Registration
  As a new user
  I want to register using my email with OTP verification
  So that my identity is verified before accessing the system
  
  Acceptance Criteria:
  - Given I request registration with email
  - When the system sends OTP to my email
  - Then I can verify and complete registration
  - And my account is created with "pending" status until verified

US-011: Phone OTP Login
  As a returning user
  I want to login using phone number with OTP
  So that I can access the system securely without password
  
  Acceptance Criteria:
  - Given I request login with phone number
  - When the system sends OTP via SMS
  - Then I can verify OTP within 5 minutes
  - And I'm logged in with my session established

US-012: Profile Update
  As an authenticated user
  I want to update my profile information
  So that my details are current
  
  Acceptance Criteria:
  - Given I'm logged in
  - When I update my name, department, or position
  - Then the changes are saved immediately
  - And audit log records the change
```

#### 2.4.3 Data Model

```yaml
User:
  id: UUID (PK)
  line_user_id: String (unique, nullable)
  email: String (unique)
  phone: String (unique)
  display_name: String
  department: String
  position: String
  role: Enum[admin, user, approver]
  status: Enum[active, pending, suspended]
  created_at: Timestamp
  updated_at: Timestamp
  last_login: Timestamp

OTPVerification:
  id: UUID (PK)
  user_id: UUID (FK)
  type: Enum[email, phone]
  code: String (hashed)
  expires_at: Timestamp
  verified: Boolean
  created_at: Timestamp
```

---

### 2.5 Job Policy System

#### Overview

ระบบ Job Policy ช่วยให้ Admin กำหนดขอบเขตการทำงานของ Agent โดยสร้าง "Job" ที่มีเงื่อนไข สิทธิ์ และ data source ชัดเจน

#### 2.5.1 Feature Requirements

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-050 | Job Policy Creation | **Must** | Admin สร้าง Job Policy ใหม่ผ่าน Agent conversation |
| F-051 | Job Policy Templates | **Should** | มี templates สำหรับ Job types ทั่วไป |
| F-052 | Column-level Access Control | **Must** | กำหนดสิทธิ์ดู column ตาม role/user |
| F-053 | Row-level Access Control | **Must** | กำหนดสิทธิ์ดู row ตามเงื่อนไข (เช่น ราคาไม่เกิน X) |
| F-054 | Job Selection Menu | **Must** | User เลือก Job จากเมนูก่อนใช้งาน |
| F-055 | Policy Enforcement | **Must** | ระบบ filter ข้อมูลตาม policy ก่อนตอบ |
| F-056 | Job Audit Log | **Should** | บันทึกทุกการ query และผลลัพธ์ |
| F-057 | Policy Versioning | **Could** | เก็บประวัติการเปลี่ยนแปลง policy |

#### 2.5.2 Job Type 1: Product Price Inquiry

**Description:** สอบถามราคาสินค้าจาก Google Sheet ที่ Admin กำหนด

**User Stories:**

```gherkin
Feature: Job1 - Product Price Inquiry

US-020: Admin Configure Price Inquiry Job
  As an admin
  I want to configure a Product Price Inquiry job with Google Sheet data source
  So that users can query product information through LINE
  
  Acceptance Criteria:
  - Given I'm an admin
  - When I provide Google Sheet URL and column mapping
  - Then the job is created with data source configured
  - And I can set access policies for columns and rows

US-021: Column-level Access Control
  As an admin
  I want to restrict which columns a user can see
  So that sensitive information is protected
  
  Acceptance Criteria:
  - Given I configure Job1 with columns A,B,C,D
  - When I set "Role: Staff" to see only A,C
  - Then Staff users querying the job see only columns A and C
  - And column B values are masked or hidden

US-022: Row-level Price Filter
  As an admin
  I want to limit price visibility based on user role
  So that users only see prices within their authorization
  
  Acceptance Criteria:
  - Given I set "Role: Staff" max price = 10,000 THB
  - When a Staff user queries products
  - Then results with price > 10,000 THB are filtered out
  - Or prices are masked with "Contact Admin" message

US-023: User Query Product
  As a user
  I want to search for product prices via LINE
  So that I can get information without opening another system
  
  Acceptance Criteria:
  - Given Job1 is available and I'm authorized
  - When I select "Job1: Product Price" from menu
  - And I type "ราคาสินค้า X"
  - Then I receive filtered results based on my access policy
  - And I don't see columns/rows I'm not authorized for
```

**Data Flow for Job1:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     JOB1: PRODUCT PRICE INQUIRY                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input: "ราคาสินค้า iPhone 15"                              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Intent      │ ← Detect: Product Price Query                   │
│  │ Detection   │                                                 │
│  └─────┬───────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Job         │ ← Match: Job1 (Product Price Inquiry)           │
│  │ Router      │                                                 │
│  └─────┬───────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Policy      │ ← Fetch User's Policies for Job1                │
│  │ Resolver    │   - Column Access: [A, C] (not B, D)            │
│  └─────┬───────┘   - Row Filter: price <= 10,000 THB             │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Data Source │ ← Query Google Sheet with filters               │
│  │ Connector   │   SELECT A, C FROM sheet WHERE price <= 10000   │
│  └─────┬───────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Response    │ ← Format response for LINE                      │
│  │ Formatter   │   - Show only authorized columns                │
│  └─────┬───────┘   - Mask unauthorized values                    │
│        │                                                         │
│        ▼                                                         │
│  Output: "iPhone 15: ฿9,999 ✓ (Column A, C shown, B hidden)"     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.5.3 Job Type 2: Approval/Permission Request

**Description:** สร้าง task เพื่อขออนุมัติและส่งไปยังผู้มีอำนาจตาม Org Chart

**User Stories:**

```gherkin
Feature: Job2 - Approval Request

US-030: Create Approval Request
  As a user
  I want to create an approval request through LINE
  So that I can get authorization without using email/forms
  
  Acceptance Criteria:
  - Given I select "Job2: Approval Request"
  - When I provide request details (title, description, type)
  - Then a task is created with status "pending"
  - And the system routes to my direct approver

US-031: Auto-route to Approver
  As a user
  I want my request to automatically go to the right approver
  So that I don't need to know who to contact
  
  Acceptance Criteria:
  - Given I create an approval request
  - When the system checks Org Chart
  - Then it routes to my direct supervisor
  - And the approver receives notification

US-032: Approver Review Request
  As an approver
  I want to receive and review approval requests in LINE
  So that I can respond quickly
  
  Acceptance Criteria:
  - Given I'm an approver
  - When a new request arrives
  - Then I receive notification with request details
  - And I can approve/reject with a comment via Quick Reply

US-033: Approval Chain
  As a system
  I want to route requests through approval chain if needed
  So that complex requests get multi-level approval
  
  Acceptance Criteria:
  - Given a request exceeds single approver limit
  - When first approver approves
  - Then it routes to next level approver
  - And requester is notified of progress
```

**Data Flow for Job2:**

```
┌─────────────────────────────────────────────────────────────────┐
│                  JOB2: APPROVAL/PERMISSION REQUEST               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input: "ขออนุมัติซื้อคอมพิวเตอร์ ราคา 50,000 บาท"            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Request     │ ← Extract: type=purchase, amount=50000          │
│  │ Parser      │                                                 │
│  └─────┬───────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Org Chart   │ ← Find: User's direct supervisor                │
│  │ Resolver    │   - Check approval limits                      │
│  └─────┬───────┘   - 50,000 > 10,000 → need Manager level       │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Task        │ ← Create: approval task                         │
│  │ Creator     │   - Assignee: Manager A                         │
│  └─────┬───────┘   - Status: pending                             │
│        │              - Due: 3 days                              │
│        ▼                                                         │
│  ┌─────────────┐                                                 │
│  │ Notification│ ← Notify: Approver via LINE                    │
│  │ Service     │   - Include: request details, Quick Reply btns │
│  └─────┬───────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  Output: "ส่งคำขอไปยัง Manager A แล้ว (Task #1234)"              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.5.4 Job Type XXX: Extensible Jobs

**Description:** Admin เพิ่ม Job ใหม่ผ่านการคุยกับ Agent

**User Stories:**

```gherkin
Feature: Extensible Jobs

US-040: Admin Create New Job via Conversation
  As an admin
  I want to create a new job type by describing it to the Agent
  So that I can extend capabilities without coding
  
  Acceptance Criteria:
  - Given I'm an admin
  - When I describe "สร้าง job สำหรับเช็ค stock คงเหลือ"
  - Then the Agent guides me through configuration
  - And a new Job3 is created with my specifications

US-041: Configure Job via Admin Portal
  As an admin
  I want to use a web portal to configure job details
  So that I have full control over complex configurations
  
  Acceptance Criteria:
  - Given I access Admin Portal
  - When I create/edit a job
  - Then I can set: name, description, data source, policies
  - And changes are applied immediately

US-042: Job Policy Template
  As an admin
  I want to use templates for common job types
  So that I can create jobs faster
  
  Acceptance Criteria:
  - Given I select "Create from Template"
  - When I choose "Price Inquiry Template"
  - Then a new job is created with pre-configured settings
  - And I only need to customize data source and policies
```

#### 2.5.5 Job Policy Data Model

```yaml
JobPolicy:
  id: UUID (PK)
  name: String
  description: Text
  type: Enum[price_inquiry, approval_request, custom]
  data_source_id: UUID (FK -> DataSource)
  status: Enum[active, inactive, draft]
  created_by: UUID (FK -> User)
  created_at: Timestamp
  updated_at: Timestamp

JobPolicyRule:
  id: UUID (PK)
  job_policy_id: UUID (FK)
  rule_type: Enum[column_access, row_filter, amount_limit]
  target: String # column name, filter field, etc.
  condition: JSON # {operator: "<=", value: 10000}
  applies_to: Enum[role, user, department]
  applies_to_value: String # role name, user id, department name
  
JobAssignment:
  id: UUID (PK)
  job_policy_id: UUID (FK)
  user_id: UUID (FK -> User)
  assigned_at: Timestamp
  assigned_by: UUID (FK -> User)
```

---

### 2.6 Organization Chart & Approval Workflow

#### Overview

ระบบจัดการโครงสร้างองค์กรและลำดับการอนุมัติ

#### 2.6.1 Feature Requirements

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-060 | Org Chart Management | **Must** | Admin สร้าง/แก้ไขโครงสร้างองค์กร |
| F-061 | Reporting Hierarchy | **Must** | กำหนด superior-subordinate relationship |
| F-062 | Approval Authority | **Must** | กำหนดขอบเขตอำนาจอนุมัติ (จำนวนเงิน, ประเภท) |
| F-063 | Delegation | **Should** | มอบอำนาจชั่วคราวให้คนอื่น |
| F-064 | Multi-level Approval | **Must** | รองรับ chain approval หลายระดับ |
| F-065 | Approval Escalation | **Should** | ยกระดับถ้า approver ไม่ตอบภายในเวลา |
| F-066 | Org Chart Visualization | **Could** | แสดงโครงสร้างเป็น diagram |

#### 2.6.2 User Stories

```gherkin
Feature: Organization Chart

US-050: Admin Configure Org Structure
  As an admin
  I want to define the organizational hierarchy
  So that approval routing works correctly
  
  Acceptance Criteria:
  - Given I access Admin Portal
  - When I create departments and assign reporting lines
  - Then the org chart is saved
  - And approval requests route correctly

US-051: Set Approval Limits
  As an admin
  I want to set approval limits per role/position
  So that large requests go to appropriate approvers
  
  Acceptance Criteria:
  - Given I configure approval limits
  - When I set "Manager: 50,000 THB, Director: 500,000 THB"
  - Then requests above 50,000 go to Director
  - And requests above 500,000 go to VP

US-052: Delegate Approval Authority
  As an approver
  I want to delegate my approval authority temporarily
  So that approvals continue when I'm unavailable
  
  Acceptance Criteria:
  - Given I'm an approver going on leave
  - When I delegate to my backup
  - Then pending requests route to the backup
  - And I'm notified of actions taken
```

#### 2.6.3 Org Chart Data Model

```yaml
Organization:
  id: UUID (PK)
  name: String
  code: String (unique)
  parent_org_id: UUID (FK, nullable)
  created_at: Timestamp

Position:
  id: UUID (PK)
  title: String
  org_id: UUID (FK -> Organization)
  level: Integer # hierarchy level
  
UserPosition:
  id: UUID (PK)
  user_id: UUID (FK -> User)
  position_id: UUID (FK -> Position)
  reports_to: UUID (FK -> UserPosition, nullable)
  is_primary: Boolean
  
ApprovalAuthority:
  id: UUID (PK)
  position_id: UUID (FK -> Position)
  approval_type: Enum[purchase, leave, expense, custom]
  max_amount: Decimal
  currency: String (default: THB)
  
ApprovalDelegation:
  id: UUID (PK)
  from_user_id: UUID (FK -> User)
  to_user_id: UUID (FK -> User)
  approval_type: Enum[all, purchase, leave, expense]
  start_date: Timestamp
  end_date: Timestamp
  status: Enum[active, expired, cancelled]
```

---

### 2.7 Admin Portal Features

#### Overview

Web Portal สำหรับ Admin จัดการระบบ

#### 2.7.1 Feature Requirements

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-070 | Admin Dashboard | **Must** | Overview ของระบบ (users, jobs, pending approvals) |
| F-071 | User Management UI | **Must** | หน้าจัดการ users, roles, permissions |
| F-072 | Job Policy Editor | **Must** | UI สำหรับสร้าง/แก้ไข Job Policies |
| F-073 | Org Chart Editor | **Must** | UI สำหรับจัดการโครงสร้างองค์กร |
| F-074 | Data Source Manager | **Must** | เชื่อมต่อและจัดการ data sources |
| F-075 | Audit Log Viewer | **Should** | ดูประวัติการใช้งานและการเปลี่ยนแปลง |
| F-076 | Analytics Dashboard | **Could** | สถิติการใช้งาน, performance metrics |
| F-077 | Bulk Operations | **Could** | นำเข้า/ส่งออก users, policies จำนวนมาก |

#### 2.7.2 Admin Portal Structure

```
Admin Portal
├── Dashboard
│   ├── Active Users
│   ├── Pending Approvals
│   ├── Active Jobs
│   └── Recent Activity
│
├── User Management
│   ├── Users List
│   ├── Roles & Permissions
│   └── User Import/Export
│
├── Job Policies
│   ├── Jobs List
│   ├── Create/Edit Job
│   ├── Policy Rules
│   └── Assign to Users/Roles
│
├── Organization
│   ├── Org Chart View
│   ├── Positions Management
│   ├── Approval Authorities
│   └── Delegations
│
├── Data Sources
│   ├── Google Sheets Connections
│   ├── API Connections
│   └── Database Connections
│
└── Settings
    ├── System Configuration
    ├── Audit Logs
    └── API Keys
```

---

### 2.8 Data Source Integration (Google Sheets API)

#### Overview

เชื่อมต่อกับ Google Sheets เป็น data source สำหรับ Job Policies

#### 2.8.1 Feature Requirements

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-080 | Google Sheets Connection | **Must** | เชื่อมต่อ Google Sheets API |
| F-081 | Sheet Selection | **Must** | เลือก spreadsheet และ worksheet |
| F-082 | Column Mapping | **Must** | map columns กับ fields ในระบบ |
| F-083 | Data Caching | **Should** | cache ข้อมูลเพื่อลด API calls |
| F-084 | Auto-refresh | **Should** | refresh ข้อมูลอัตโนมัติตาม schedule |
| F-085 | Query Builder | **Should** | สร้าง query จาก user input |
| F-086 | Error Handling | **Must** | จัดการกรณี sheet ไม่พร้อมใช้งาน |

#### 2.8.2 User Stories

```gherkin
Feature: Google Sheets Integration

US-060: Connect Google Sheet
  As an admin
  I want to connect a Google Sheet as data source
  So that Job policies can query real-time data
  
  Acceptance Criteria:
  - Given I have Google Sheets API credentials
  - When I provide the spreadsheet URL
  - Then the system connects and shows available sheets
  - And I can select which worksheet to use

US-061: Map Columns
  As an admin
  I want to map sheet columns to system fields
  So that queries work correctly
  
  Acceptance Criteria:
  - Given a connected sheet
  - When I map Column A -> product_name, Column B -> price
  - Then queries use these field names
  - And policy rules can reference mapped names

US-062: Query with Policy Filter
  As a system
  I want to query Google Sheet with policy filters applied
  So that users only see authorized data
  
  Acceptance Criteria:
  - Given user queries "iPhone price"
  - When system queries Google Sheet
  - Then it applies column filter (SELECT A, C only)
  - And it applies row filter (WHERE price <= user_limit)
```

#### 2.8.3 Data Source Configuration

```yaml
DataSource:
  id: UUID (PK)
  name: String
  type: Enum[google_sheets, api, database]
  config: JSON
  # For Google Sheets:
  # {
  #   "spreadsheet_id": "abc123",
  #   "sheet_name": "Products",
  #   "credentials_encrypted": "...",
  #   "column_mapping": {
  #     "A": "product_name",
  #     "B": "price",
  #     "C": "stock"
  #   }
  # }
  refresh_interval_minutes: Integer
  last_sync: Timestamp
  status: Enum[connected, error, pending]
  created_at: Timestamp
```


## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Response Time | First response within 5 seconds |
| NFR-002 | Throughput | Support 100 concurrent users |
| NFR-003 | Agent Response | Forward to agent within 2 seconds |
| NFR-004 | Message Delivery | 99.5% successful delivery |

### 3.2 Security

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-010 | Webhook Verification | Verify LINE signature on all webhooks |
| NFR-011 | Channel Secret | Secure storage of Channel Secret |
| NFR-012 | Access Token | Secure storage of Channel Access Token |
| NFR-013 | User Data | Encrypt sensitive user data at rest |
| NFR-014 | Rate Limiting | Implement rate limiting per user |
| NFR-015 | Input Validation | Sanitize all user inputs |

### 3.3 Scalability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-020 | Horizontal Scaling | Support container-based scaling |
| NFR-021 | Stateless Design | Stateless webhook handler |
| NFR-022 | Queue-based Processing | Use message queue for high load |
| NFR-023 | Database Scaling | Support database connection pooling |

### 3.4 Reliability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-030 | Uptime | 99% availability |
| NFR-031 | Error Handling | Graceful error handling with user feedback |
| NFR-032 | Retry Logic | Retry failed LINE API calls with backoff |
| NFR-033 | Logging | Comprehensive logging for debugging |

---

## 4. Integration Requirements

### 4.1 LINE Messaging API

| Feature | Usage | Priority |
|---------|-------|----------|
| **Webhook** | Receive messages/events | **Must** |
| **Reply Message** | Reply to user messages | **Must** |
| **Push Message** | Send unsolicited messages | **Must** |
| **Flex Message** | Rich formatted content | **Should** |
| **Quick Reply** | Action suggestions | **Should** |
| **Rich Menu** | Persistent menu | **Could** |
| **Get Profile** | Get user profile info | **Should** |
| **Leave/Join Events** | Handle group events | **Could** |

### 4.2 Agent Team Integration

| Integration | Description | Priority |
|-------------|-------------|----------|
| **Agent API** | HTTP/WebSocket to Agent services | **Must** |
| **Context Store** | Shared context storage | **Must** |
| **Event Bus** | Inter-agent communication | **Should** |
| **Session Store** | User session management | **Must** |

### 4.3 Database/Storage

| Data Type | Storage | Priority |
|-----------|---------|----------|
| **User Sessions** | Redis / In-memory | **Must** |
| **Conversation History** | PostgreSQL / MongoDB | **Should** |
| **User Preferences** | Database | **Should** |
| **Agent Registry** | Config file / Database | **Must** |
| **Logs** | Log aggregation service | **Should** |

---

## 5. Constraints

### 5.1 Technical Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| TC-001 | LINE Webhook requires HTTPS | Need SSL certificate / tunneling |
| TC-002 | LINE Reply token expires in 60s | Must respond quickly or use Push |
| TC-003 | Message size limit (5KB for text) | Chunk long responses |
| TC-004 | Rate limits on LINE API | Implement rate limiting |
| TC-005 | Node.js runtime | Use Node.js/TypeScript stack |

### 5.2 Budget Constraints

| Constraint | Description |
|------------|-------------|
| BC-001 | LINE Messaging API: Free tier available |
| BC-002 | Server hosting: TBD based on deployment |
| BC-003 | Database: Free tier may be sufficient initially |

### 5.3 Timeline Constraints

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | 1-2 weeks | Basic message handling + single agent |
| Phase 2 | 1-2 weeks | Agent routing + multiple agents |
| Phase 3 | 1-2 weeks | Rich messages + advanced features |
| Phase 4 | 1 week | Testing + deployment |

---

## 6. Assumptions

| ID | Assumption | Risk if Wrong |
|----|------------|---------------|
| A-001 | Agent services are accessible via HTTP API | Need different integration approach |
| A-002 | LINE Channel is already created | Must create and configure |
| A-003 | Users have LINE accounts | Alternative interface needed |
| A-004 | Server can receive inbound connections | Need tunneling solution (ngrok, etc.) |
| A-005 | Agent responses are text-based | May need format conversion |
| A-006 | Single LINE Official Account | May need multiple channels |

---

## 7. Open Questions

### 7.1 Technical Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| Q-001 | Agent API endpoint format and authentication? | uncle | High |
| Q-002 | How to handle agent timeout scenarios? | zata | Medium |
| Q-003 | Should we support LINE Groups or only 1:1? | zata | Medium |
| Q-004 | What's the session timeout duration? | zata | Low |

### 7.2 Business Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| Q-010 | Who are the initial beta users? | jarvis | High |
| Q-011 | What's the expected user volume? | jarvis | Medium |
| Q-012 | Are there any restricted agent capabilities? | jarvis | Medium |
| Q-013 | Should external users have limited access? | jarvis | Medium |

### 7.3 UX Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| Q-020 | What should the default greeting message be? | ally | Medium |
| Q-021 | Should we use Rich Menu for navigation? | ally | Low |
| Q-022 | How to display long agent responses? | ally | Medium |

---

## 8. Data Flow Diagrams

### 8.1 Overall System Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LINE AGENT SYSTEM DATA FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐                                                               │
│   │  LINE    │                                                               │
│   │  User    │                                                               │
│   └────┬─────┘                                                               │
│        │ Message                                                              │
│        ▼                                                                      │
│   ┌──────────┐     ┌──────────────┐                                          │
│   │  LINE    │────▶│   Webhook    │                                          │
│   │ Platform │◀────│   Handler    │                                          │
│   └──────────┘     └──────┬───────┘                                          │
│                           │                                                   │
│                           ▼                                                   │
│                    ┌──────────────┐                                          │
│                    │    Auth      │                                          │
│                    │   Service    │◀────┐                                    │
│                    └──────┬───────┘     │                                    │
│                           │              │                                    │
│                           ▼              │                                    │
│   ┌──────────────────────────────────────────────────┐                      │
│   │               POLICY ENGINE                       │                      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │                      │
│   │  │   Job       │  │   Org       │  │  Data    │ │                      │
│   │  │   Router    │──▶│   Chart     │──▶│  Source  │ │                      │
│   │  │             │  │  Resolver   │  │  Query   │ │                      │
│   │  └─────────────┘  └─────────────┘  └──────────┘ │                      │
│   └───────────────────────┬──────────────────────────┘                      │
│                           │                                                   │
│                           ▼                                                   │
│                    ┌──────────────┐                                          │
│                    │   Agent      │                                          │
│                    │   Service    │                                          │
│                    └──────┬───────┘                                          │
│                           │                                                   │
│                           ▼                                                   │
│                    ┌──────────────┐                                          │
│                    │   Response   │                                          │
│                    │   Formatter  │                                          │
│                    └──────────────┘                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Job Policy Filtering Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      JOB POLICY FILTERING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INPUT: User Query + User Context                                           │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STEP 1: User Authentication                                      │       │
│   │ - Verify user session                                            │       │
│   │ - Load user role and department                                  │       │
│   │ - Check user status (active/suspended)                           │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                            │
│                                ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STEP 2: Job Selection                                            │       │
│   │ - Match query to available jobs                                  │       │
│   │ - Verify user has access to selected job                         │       │
│   │ - Load job configuration                                         │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                            │
│                                ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STEP 3: Policy Resolution                                        │       │
│   │ - Load applicable policies for user+job                          │       │
│   │ - Merge policies (user > role > department > default)            │       │
│   │ - Build filter criteria                                          │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                            │
│                                ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STEP 4: Data Query with Filters                                  │       │
│   │ - Query data source (Google Sheet/API)                           │       │
│   │ - Apply column filters (SELECT authorized_columns)               │       │
│   │ - Apply row filters (WHERE conditions)                           │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                            │
│                                ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ STEP 5: Response Sanitization                                    │       │
│   │ - Mask unauthorized values                                       │       │
│   │ - Format for LINE (text/flex message)                            │       │
│   │ - Log query for audit                                            │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                            │
│                                ▼                                            │
│   OUTPUT: Filtered Response to User                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Approval Workflow Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      APPROVAL WORKFLOW DATA FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER: Create Request                                                       │
│        │                                                                     │
│        ▼                                                                     │
│   ┌──────────────┐                                                          │
│   │ Parse        │ ───▶ Extract: type, amount, details                      │
│   │ Request      │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │ Org Chart    │ ───▶ Find: reporter's position                           │
│   │ Lookup       │      Find: direct superior                               │
│   └──────┬───────┘      Check: approval authority                           │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────────────────────────────────────────────┐                  │
│   │               APPROVAL ROUTING LOGIC                  │                  │
│   │                                                       │                  │
│   │   amount <= position.max_amount?                      │                  │
│   │        │                                              │                  │
│   │   ┌────┴────┐                                        │                  │
│   │   ▼         ▼                                        │                  │
│   │  YES       NO ───▶ Find next level approver          │                  │
│   │   │               (recursive until authorized)        │                  │
│   │   ▼                                                   │                  │
│   │ Route to approver                                     │                  │
│   └───────────────────────┬──────────────────────────────┘                  │
│                           │                                                  │
│                           ▼                                                  │
│   ┌──────────────┐                                                          │
│   │ Create Task  │ ───▶ Status: pending                                     │
│   │              │      Assignee: approver                                  │
│   └──────┬───────┘      Due: calculated from config                         │
│          │                                                                   │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │ Notify       │ ───▶ Send LINE message to approver                       │
│   │ Approver     │      Include: request details, action buttons            │
│   └──────────────┘                                                          │
│                                                                              │
│   ────────────────────────────────────────────────────────                  │
│                                                                              │
│   APPROVER: Review & Respond                                                 │
│        │                                                                     │
│        ▼                                                                     │
│   ┌──────────────┐                                                          │
│   │ Approve?     │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                   │
│   ┌──────┴──────┐                                                           │
│   ▼             ▼                                                           │
│  YES           NO                                                            │
│   │             │                                                            │
│   ▼             ▼                                                            │
│   ┌─────────┐  ┌─────────┐                                                  │
│   │ Check   │  │ Reject  │──▶ Notify user                   │
│   │ Chain   │  │ Log     │    Log decision                  │
│   └────┬────┘  └─────────┘                                                  │
│        │                                                                     │
│        ▼                                                                     │
│   More levels?                                                               │
│   ┌────┴────┐                                                               │
│   ▼         ▼                                                               │
│  YES       NO ───▶ Complete ───▶ Notify user of approval                    │
│   │                         Log final decision                              │
│   ▼                                                                          │
│   Route to next approver                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

| Area | Risk | Mitigation | Priority |
|------|------|------------|----------|
| OTP Security | OTP interception | Short expiry (5 min), rate limit OTP requests | **Must** |
| Session Hijacking | Token theft | Short session expiry, secure cookie flags, token rotation | **Must** |
| LINE ID Spoofing | Fake LINE accounts | Verify LINE signature, link to verified email/phone | **Must** |
| Role Escalation | User modifies own role | Server-side role validation, audit all role changes | **Must** |

### 9.2 Data Protection

| Area | Risk | Mitigation | Priority |
|------|------|------------|----------|
| Column-level Data | Unauthorized column access | Enforce at query level, never trust client | **Must** |
| Row-level Data | Filter bypass | Apply filters server-side, validate all query parameters | **Must** |
| Google Sheets Credentials | Credential exposure | Encrypt at rest, use service accounts, rotate keys | **Must** |
| Audit Logs | Log tampering | Append-only logs, secure storage, integrity checks | **Should** |

### 9.3 API Security

| Area | Risk | Mitigation | Priority |
|------|------|------------|----------|
| LINE Webhook | Spoofed requests | Verify X-Line-Signature on every request | **Must** |
| Google Sheets API | Quota exhaustion | Cache data, rate limit queries, use batch requests | **Should** |
| Admin Portal | Unauthorized access | MFA for admin, IP whitelist, audit all actions | **Should** |
| Agent API | Data exfiltration | Validate all agent responses, sanitize before sending | **Must** |

### 9.4 Privacy Considerations

| Area | Requirement | Implementation |
|------|-------------|----------------|
| Personal Data | Minimize collection | Only collect necessary fields |
| Data Retention | Define retention policy | Auto-delete old logs, offer data export |
| User Consent | Clear consent flow | Explain data usage at registration |
| Right to Delete | Support deletion | Implement user data deletion workflow |

### 9.5 Security Checklist

```yaml
Pre-launch Security Checklist:
  Authentication:
    - [ ] OTP expiry <= 5 minutes
    - [ ] Session timeout configured
    - [ ] LINE signature verification enabled
    - [ ] Rate limiting on auth endpoints
    
  Authorization:
    - [ ] Role-based access control tested
    - [ ] Column-level filtering verified
    - [ ] Row-level filtering verified
    - [ ] Admin actions require re-auth
    
  Data Protection:
    - [ ] Google credentials encrypted
    - [ ] Database encryption at rest
    - [ ] HTTPS enforced everywhere
    - [ ] Sensitive data masked in logs
    
  Monitoring:
    - [ ] Audit logging enabled
    - [ ] Alert on suspicious activity
    - [ ] Regular security review scheduled
```

---

## Appendix A: LINE Messaging API Reference

### Key Endpoints

```
POST /v2/bot/message/reply    - Reply to a message
POST /v2/bot/message/push     - Send push message
POST /v2/bot/message/multicast - Send to multiple users
GET  /v2/bot/profile/{userId} - Get user profile
POST /v2/bot/richmenu         - Create rich menu
```

### Webhook Events

- `message` - User sent a message
- `follow` - User added bot as friend
- `unfollow` - User blocked bot
- `join` - Bot joined a group
- `leave` - Bot left a group

---

## Appendix B: MoSCoW Summary

### Original Features

| Priority | Count | Features |
|----------|-------|----------|
| **Must** | 12 | Core messaging, agent routing, session management |
| **Should** | 10 | Rich messages, user preferences, logging |
| **Could** | 5 | Rich menu, history, multi-agent tasks |
| **Won't** | 0 | (Future considerations) |

### New Features (v1.1)

| Priority | Count | Features |
|----------|-------|----------|
| **Must** | 20 | User auth (OTP), Job Policy system, Org Chart, Admin Portal, Google Sheets |
| **Should** | 12 | Profile management, delegation, caching, analytics |
| **Could** | 6 | MFA, policy versioning, org chart viz, bulk ops |
| **Won't** | 0 | (Future considerations) |

### Consolidated Summary

| Priority | Total | Key Areas |
|----------|-------|-----------|
| **Must** | 32 | Core messaging, auth, job policies, org chart, admin portal, data integration |
| **Should** | 22 | Rich messages, caching, delegation, logging, analytics |
| **Could** | 11 | MFA, visualization, bulk operations, advanced features |
| **Won't** | 0 | (Future considerations) |

---

## Appendix C: INVEST Validation for User Stories

### Original Stories (US-001 to US-005)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-001 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Well-defined |
| US-002 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Simple routing |
| US-003 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Session handling |
| US-004 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | May need multiple sprints |
| US-005 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | UI enhancement |

### Authentication Stories (US-010 to US-012)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-010 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Email OTP flow |
| US-011 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Phone OTP flow |
| US-012 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Profile management |

### Job1: Product Price Inquiry (US-020 to US-023)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-020 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Job configuration |
| US-021 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Column-level access |
| US-022 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Row-level filtering |
| US-023 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | User query experience |

### Job2: Approval Request (US-030 to US-033)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-030 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Create request |
| US-031 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Auto-routing |
| US-032 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Approver review |
| US-033 | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ | Complex, needs refinement |

### Extensible Jobs (US-040 to US-042)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-040 | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | Agent-driven config - complex |
| US-041 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Portal configuration |
| US-042 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Template system |

### Organization Chart (US-050 to US-052)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-050 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Org structure config |
| US-051 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Approval limits |
| US-052 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Delegation system |

### Google Sheets Integration (US-060 to US-062)

| Story | I | N | V | E | S | T | Notes |
|-------|---|---|---|---|---|---|-------|
| US-060 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Connect sheet |
| US-061 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Column mapping |
| US-062 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Query with policy |

### INVEST Legend
- **I**ndependent: Can be developed separately
- **N**egotiable: Requirements can be adjusted
- **V**aluable: Provides value to user
- **E**stimable: Can be estimated
- **S**mall: Fits in single sprint
- **T**estable: Can be tested
- ✅ = Passes criterion
- ⚠️ = Partially passes / Review needed
- ❌ = Does not pass / Needs revision

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-19 | zata | Initial requirements document |
| 1.1 | 2026-03-19 | zata | Added User Authentication & Registration (2.8), Job Policy System (2.9), Organization Chart & Approval Workflow (2.10), Admin Portal Features (2.11), Data Source Integration (2.12), Data Flow Diagrams (Section 8), Security Considerations (Section 9) |
| 1.2 | 2026-03-19 | zata | Added summary sections: User Authentication (10), Job Policy System (11), Organization Chart (12), Admin Portal (13) |

---


| 1.4 | 2026-03-19 | zata | Reorganized document: removed duplicate sections, fixed TOC numbering, cleaned structure |

---

_Created by: zata (Requirement Analyst)_
_Date: 2026-03-19_
_Last Updated: 2026-03-19_
