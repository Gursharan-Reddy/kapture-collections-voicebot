# High-Level Design (HLD) Document: Kapture Collections Voicebot System

## 1. Executive Summary
The Kapture Collections Voicebot ("Maya") is an automated, AI-driven outbound voice agent designed to handle debt collection calls, customer authentication, overdue EMI notifications, and Promise-to-Pay (PTP) negotiations. The system integrates real-time conversational voice AI (Vapi) with a local Node.js backend webhook server to securely authenticate customers, manage state-driven dialogue flows, and execute business logic transactions.

---

## 2. System Architecture & Component Workflow

The system architecture follows a linear request-response flow:

Vapi Voice Platform (LLM / STT / TTS) 
    |
    | (HTTPS POST /webhook via ngrok tunnel)
    V
Local Node.js / Express Server
    |
    |--- [ Tool Execution ]
    |      - verify_customer
    |      - log_promise_to_pay
    |      - send_payment_link
    |      - escalate_to_agent
    |      - mark_disposition
    |      - end_collection_call
    |
    |--- [ State & Logging ]

### Core Components:
1. **Voice AI Layer (Vapi Platform)**: Handles speech-to-text (STT), natural language understanding via LLM (OpenAI), text-to-speech (TTS), and real-time audio streaming.
2. **Tunneling Layer (ngrok)**: Exposes the local development environment securely to the public internet so Vapi can transmit tool-call webhooks.
3. **Backend Integration & Mock Server (Node.js & Express)**: Listens for incoming webhook events (tool-calls), processes business rules, validates parameters, and returns structured JSON responses back to the voice agent.

---

## 3. Data Flow & State Machine Workflow

The conversational flow operates under a strict state machine regime governed by the system prompt and compliance rules:

1. **State 0: Greeting & Introduction**
   - Maya introduces herself on behalf of Kapture Finance and confirms the target customer identity.
   - If the wrong person is reached, the system triggers `mark_disposition(status="WRONG_PERSON")` and terminates the call.
2. **State 1: Secure Identity Verification**
   - Maya prompts for the last 4 digits of the PAN card or birth year.
   - Upon user input, the system calls `verify_customer(account_id, verification_code)`.
   - **Compliance Rule**: No financial or debt details are disclosed until `verified: true` is returned.
3. **State 2: Disclosure & Negotiation**
   - Once authenticated, Maya discloses the overdue EMI details (e.g., ₹8,499 overdue by 12 days).
   - Depending on user response, branches execute:
     - **Branch A (PTP)**: Captures payment date and logs via `log_promise_to_pay` and `send_payment_link`.
     - **Branch B (Already Paid)**: Logs via `mark_disposition(status="ALREADY_PAID")`.
     - **Branch C/D (Hardship / Dispute)**: Triggers `escalate_to_agent`.
     - **Branch E (Opt-out)**: Triggers `mark_disposition(status="DO_NOT_CALL")`.
4. **State 3 & 4: Action Execution & Wrap-up**
   - Finalizes disposition and invokes `end_collection_call` to cleanly close the session.

---

## 4. Tool Definitions & API Endpoints

The backend server exposes a single webhook endpoint (POST /webhook) that dynamically routes requests based on the requested tool function name:

| Tool Name | Parameters | Description / Return Payload |
| :--- | :--- | :--- |
| `verify_customer` | account_id, verification_code | Validates credentials. Returns verified: boolean. |
| `log_promise_to_pay` | account_id, ptp_date, amount | Records PTP date and amount. Returns confirmation ID. |
| `send_payment_link` | account_id, channel | Dispatches payment gateway links via SMS/Email. |
| `escalate_to_agent` | reason | Queues human intervention. Returns escalation ticket ID. |
| `mark_disposition` | status, notes | Logs final call outcome status. |
| `end_collection_call` | None | Terminates the active voice connection. |

---

## 5. Security & Compliance Measures
- **Zero Debt Disclosure Before Auth**: Enforced strictly via system prompt constraints.
- **Input Validation**: Parameter schemas (JSON schema) ensure type safety before execution.
- **Environment Isolation**: Local secrets managed via environment configurations (.dotenv).