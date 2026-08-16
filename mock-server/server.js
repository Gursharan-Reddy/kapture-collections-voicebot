const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Main Webhook Endpoint for Vapi Tool Calls
app.post('/webhook', (req, res) => {
  try {
    const { message } = req.body;

    if (message && message.type === 'tool-calls') {
      const toolCall = message.toolCalls[0];
      const { name, arguments: args } = toolCall.function;
      const callId = toolCall.id;

      console.log(`[Tool Call Received]: ${name}`, args);

      let result = {};

      switch (name) {
        case 'verify_customer':
          // Clean up speech-to-text input by removing spaces, periods, or non-numeric symbols
          const rawCode = String(args.verification_code || "").replace(/[^0-9]/g, "");
          
          if (rawCode === '1234' || rawCode === '1995') {
            result = { verified: true, message: "Identity verified successfully." };
          } else {
            result = { verified: false, message: "Verification failed. Incorrect code provided." };
          }
          break;

        case 'log_promise_to_pay':
          result = {
            success: true,
            ptp_id: `PTP-${Math.floor(1000 + Math.random() * 9000)}`,
            confirmed_date: args.ptp_date,
            amount: args.amount,
            message: "Promise-to-Pay successfully registered."
          };
          break;

        case 'send_payment_link':
          result = {
            success: true,
            message: `Instant payment link successfully dispatched via ${args.channel || 'SMS'} to registered mobile number.`
          };
          break;

        case 'escalate_to_agent':
          result = {
            success: true,
            escalation_ticket: `ESC-${Math.floor(100 + Math.random() * 900)}`,
            reason: args.reason,
            message: "Call queued for human supervisor intervention."
          };
          break;

        case 'mark_disposition':
          result = {
            success: true,
            disposition_logged: args.status,
            notes: args.notes || "",
            timestamp: new Date().toISOString()
          };
          break;

        case 'end_collection_call':
          result = { success: true, message: "Call terminated successfully." };
          break;

        default:
          result = { success: false, message: "Unknown function call requested." };
      }

      return res.status(200).json({
        results: [
          {
            toolCallId: callId,
            result: JSON.stringify(result)
          }
        ]
      });
    }

    return res.status(200).json({ status: "acknowledged" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kapture Mock Collections Webhook Server running on port ${PORT}`);
});