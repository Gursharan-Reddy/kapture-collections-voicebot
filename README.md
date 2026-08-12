# Comprehensive Project Documentation: Kapture Collections Voicebot

---

## 1. Executive Summary
The Kapture Collections Voicebot ("Maya") is an automated, AI-driven outbound voice agent designed to handle debt collection calls, customer authentication, overdue EMI notifications, and Promise-to-Pay (PTP) negotiations[cite: 1, 2]. The system integrates real-time conversational voice AI (Vapi) with a local Node.js backend webhook server to securely authenticate customers, manage state-driven dialogue flows, and execute business logic transactions[cite: 1, 2].

---

## 2. System Architecture & Component Workflow

The system architecture follows a linear request-response flow:

Vapi Voice Platform (LLM / STT / TTS) 
    │
    │ (HTTPS POST /webhook via ngrok tunnel)
    ▼
Local Node.js / Express Server
    │
    ├── [ Tool Execution ]
    │      - verify_customer
    │      - log_promise_to_pay
    │      - send_payment_link
    │      - escalate_to_agent
    │      - mark_disposition
    │      - end_collection_call
    │
    └── [ State & Logging ]

### Core Components:
1. **Voice AI Layer (Vapi Platform)**[cite: 1, 2]: Handles speech-to-text (STT), natural language understanding via LLM (OpenAI), text-to-speech (TTS), and real-time audio streaming.
2. **Tunneling Layer (ngrok)**[cite: 1, 2]: Exposes the local development environment securely to the public internet so Vapi can transmit tool-call webhooks.
3. **Backend Integration & Mock Server (Node.js & Express)**[cite: 1, 2]: Listens for incoming webhook events (`tool-calls`), processes business rules, validates parameters, and returns structured JSON responses back to the voice agent.

---

## 3. Data Flow & State Machine Workflow

The conversational flow operates under a strict state machine regime governed by the system prompt and compliance rules:

1. **State 0: Greeting & Introduction**
   - Maya introduces herself on behalf of Kapture Finance and confirms the target customer identity[cite: 1, 2].
   - If the wrong person is reached, the system triggers `mark_disposition(status="WRONG_PERSON")` and terminates the call[cite: 1, 2].
2. **State 1: Secure Identity Verification**
   - Maya prompts for the last 4 digits of the PAN card or birth year[cite: 1, 2].
   - Upon user input, the system calls `verify_customer(account_id, verification_code)`[cite: 1, 2].
   - **Compliance Rule**: No financial or debt details are disclosed until `verified: true` is returned[cite: 1, 2].
3. **State 2: Disclosure & Negotiation**
   - Once authenticated, Maya discloses the overdue EMI details (e.g., ₹8,499 overdue by 12 days)[cite: 1, 2].
   - Depending on user response, branches execute:
     - **Branch A (PTP)**: Captures payment date and logs via `log_promise_to_pay` and `send_payment_link`[cite: 1, 2].
     - **Branch B (Already Paid)**: Logs via `mark_disposition(status="ALREADY_PAID")`[cite: 1, 2].
     - **Branch C/D (Hardship / Dispute)**: Triggers `escalate_to_agent`[cite: 1, 2].
     - **Branch E (Opt-out)**: Triggers `mark_disposition(status="DO_NOT_CALL")`[cite: 1, 2].
4. **State 3 & 4: Action Execution & Wrap-up**
   - Finalizes disposition and invokes `end_collection_call` to cleanly close the session[cite: 1, 2].

---

## 4. Tool Definitions & API Endpoints

The backend server exposes a single webhook endpoint (`POST /webhook`) that dynamically routes requests based on the requested tool function name[cite: 1, 2]:

| Tool Name | Parameters | Description / Return Payload |
| :--- | :--- | :--- |
| `verify_customer` | `account_id`, `verification_code` | Validates credentials against records (e.g., code `1234` or `1995`). Returns `verified: boolean`. |
| `log_promise_to_pay` | `account_id`, `ptp_date`, `amount` | Records the agreed payment date and amount. Returns confirmation ID (`ptp_id`). |
| `send_payment_link` | `account_id`, `channel` | Dispatches payment gateway links via SMS/Email. Returns delivery confirmation. |
| `escalate_to_agent` | `reason` | Queues supervisor intervention for hardship or disputes. Returns escalation ticket ID. |
| `mark_disposition` | `status`, `notes` | Logs final call outcome status (`ALREADY_PAID`, `DO_NOT_CALL`, etc.). |
| `end_collection_call` | *None* | Terminates the active voice connection session. |

---

## 5. Security & Compliance Measures
- **Zero Debt Disclosure Before Auth**: Enforced strictly via system prompt constraints and conditional state transitions[cite: 1, 2].
- **Input Validation**: Parameter schemas (`JSON schema`) ensure type safety and requirement checks (`account_id`, `verification_code`, amounts) before execution[cite: 1, 2].
- **Environment Isolation**: Local secrets and server ports managed via environment configurations (`.dotenv`)[cite: 1, 2].

---

## 6. Setup & Installation Guide

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* [ngrok](https://ngrok.com/) installed
* A Vapi account with a configured assistant

### Local Setup
1. Clone your project repository and navigate to the project directory.
2. Install required dependencies:
   ```bash
   npm install express body-parser cors dotenv

Run the mock server: node server.js
### Expose to Vapi via ngrokIn a separate terminal window, 
start your ngrok tunnel:  ngrok http 3000

Copy the generated public https URL and update your Vapi tool server endpoints to point to YOUR_NGROK_URL/webhook[cite: 2].

### 7 Testing & Verification
Ensure the Node.js server is actively running on port 3000[cite: 2].
Ensure the ngrok tunnel is open and forwarding traffic[cite: 2].
Start a web test call inside your Vapi dashboard[cite: 2].
Provide verification credentials (e.g., code 1234 or 1995) when prompted by Maya to trigger verified: true and progress through the workflow[cite: 2].