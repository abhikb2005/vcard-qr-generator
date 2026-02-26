const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BOARD_PATH = path.join(__dirname, '../../data/agent-board.md');

async function sendTelegram(message) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Telegram credentials missing.');
        return;
    }
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: `🛰️ **New Codex Instruction**\n\n${message}`,
            parse_mode: 'Markdown'
        });
        console.log('Telegram notification sent.');
    } catch (err) {
        console.error('Failed to send Telegram message:', err.message);
    }
}

async function checkBoard() {
    console.log(`Checking board at ${new Date().toISOString()}`);

    if (!fs.existsSync(BOARD_PATH)) {
        console.error('Agent board not found at', BOARD_PATH);
        return;
    }

    const content = fs.readFileSync(BOARD_PATH, 'utf8');

    // Find messages from Codex
    // Format: [Date] **Codex -> AG**: Message
    const codexMessages = [];
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.includes('**Codex -> Antigravity**') || line.includes('**Codex -> AG**')) {
            codexMessages.push(line);
        }
    });

    if (codexMessages.length === 0) {
        console.log('No Codex messages found.');
        return;
    }

    const latestMessage = codexMessages[codexMessages.length - 1];
    const messageHash = Buffer.from(latestMessage).toString('base64'); // Simple comparison key

    // Get last seen message from Supabase
    const { data: state, error: fetchError } = await supabase
        .from('internal_state')
        .select('value')
        .eq('key', 'last_codex_message')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching state:', fetchError.message);
        return;
    }

    const lastSeenHash = state?.value?.hash;

    if (messageHash !== lastSeenHash) {
        console.log('New message detected!');

        // Notify
        await sendTelegram(latestMessage);

        // Update state
        const { error: updateError } = await supabase
            .from('internal_state')
            .upsert({
                key: 'last_codex_message',
                value: { hash: messageHash, content: latestMessage, updatedAt: new Date().toISOString() },
                updated_at: new Date().toISOString()
            });

        if (updateError) {
            console.error('Error updating state:', updateError.message);
        }
    } else {
        console.log('No new messages.');
    }
}

// Loop 5 times with 60s delay to simulate "every minute" for a 5-min GH Action interval
async function run() {
    for (let i = 0; i < 5; i++) {
        await checkBoard();
        if (i < 4) {
            console.log('Waiting 60s for next check...');
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
}

run();
