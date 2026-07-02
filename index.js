import { SplitFactory } from '@splitsoftware/splitio';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

// ========== SDK Initialization ==========

let splitClient = null;
const key = 'aria-demo-user';

async function initializeSplitClient() {
  if (!process.env.SPLIT_API_KEY) {
    console.error('Error: SPLIT_API_KEY not set');
    console.error('Create a .env file with: SPLIT_API_KEY=your-sdk-key');
    process.exit(1);
  }

  const factory = SplitFactory({
    core: {
      authorizationKey: process.env.SPLIT_API_KEY,
    },
    startup: {
      readyTimeout: 10,  // 10 second timeout
    },
    // Force streaming mode (SSE) for real-time updates
    sync: {
      enabled: true,
      streaming: {
        enabled: true,  // Enable Server-Sent Events (SSE) for push updates
      },
    },
    // Add debug mode to see what's happening
    debug: process.env.DEBUG === 'true',
  });

  splitClient = factory.client();

  return new Promise((resolve, reject) => {
    splitClient.on(splitClient.Event.SDK_READY, () => {
      console.log('Split.io SDK initialized successfully');

      // Get the manager to list available splits (flags)
      const manager = factory.manager();
      const splits = manager.splits();
      console.log(`[DEBUG] Found ${splits.length} flags in this environment`);
      if (splits.length > 0) {
        console.log('[DEBUG] Available flags:', splits.map(s => s.name).join(', '));
      } else {
        console.log('[WARNING] No flags found! Make sure flags exist in the environment tied to your SDK key.');
      }

      resolve(splitClient);
    });

    splitClient.on(splitClient.Event.SDK_READY_TIMED_OUT, () => {
      reject(new Error('SDK initialization timed out. Check your API key.'));
    });
  });
}

// Setup SDK_UPDATE listener for immediate flag changes
function setupSDKUpdateListener(refreshCallback) {
  splitClient.on(splitClient.Event.SDK_UPDATE, () => {
    // SDK detected flag changes from Split.io - refresh immediately
    console.log('[DEBUG] SDK_UPDATE event received - refreshing display');
    refreshCallback();
  });
}

// ========== Flag Evaluation ==========

function evaluateFlags() {
  const abcedarian = splitClient.getTreatment(key, 'abcedarian');
  const beauty = splitClient.getTreatment(key, 'beauty');

  // Debug output
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] Flag evaluations:', {
      abcedarian,
      beauty,
    });
  }

  return {
    abcedarian: abcedarian === 'on',
    beauty: beauty === 'on',
  };
}

// ========== Text Transformation ==========

function applyFlagEffects(text, flags) {
  let result = text;

  // 1. Apply abcedarian (CAPS) first
  if (flags.abcedarian) {
    result = result.toUpperCase();
  }

  // 2. Apply beauty (colors) last to preserve ANSI codes
  if (flags.beauty) {
    result = colorizeText(result);
  }

  return result;
}

function colorizeText(text) {
  // Highlight key phrases
  return text
    .replace(/quick brown fox/gi, '\x1b[33m$&\x1b[0m')  // Yellow
    .replace(/lazy dog/gi, '\x1b[36m$&\x1b[0m')         // Cyan
    .replace(/'[abc]'/g, '\x1b[32m$&\x1b[0m');          // Green for keys
}

// ========== Display Logic ==========

function drawStatusBar(flags) {
  const green = '\x1b[32m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';

  console.log(`${bold}${cyan}★ ★ ★  Real time flag updates!  ★ ★ ★${reset}`);
  console.log('');

  const abcedarianIcon = flags.abcedarian ? `${green}[X]${reset}` : `${red}[ ]${reset}`;
  const beautyIcon = flags.beauty ? `${green}[X]${reset}` : `${red}[ ]${reset}`;

  console.log(`${bold}=== Feature Flag Demo ===${reset}`);
  console.log(`${abcedarianIcon} abcedarian (CAPS)    ${beautyIcon} beauty (colors)`);
  console.log('─'.repeat(60));
}

function draw(flags) {
  // Clear screen and move cursor to top-left
  process.stdout.write('\x1b[2J\x1b[H');

  // Draw status bar
  drawStatusBar(flags);

  // Demo content
  const demoText = `
The quick brown fox jumps over the lazy dog.
This text demonstrates feature flag effects in real-time.

Current behaviors:
- abcedarian: Transforms text to UPPERCASE
- beauty: Adds colorful highlighting

Controls:
  Press 'a' to check abcedarian state
  Press 'b' to check beauty state
  Press 'q' to quit

Change flags in Split.io UI and watch updates appear here!
`;

  const transformedText = applyFlagEffects(demoText.trim(), flags);
  console.log('\n' + transformedText);
}

// ========== Input Handling ==========

function setupKeypress(refreshCallback) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (_, key) => {
    if (!key) return;

    // Quit on 'q' or Ctrl+C
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      cleanup();
      process.exit(0);
    }

    // Refresh on flag keys
    if (['a', 'b'].includes(key.name)) {
      refreshCallback();
    }
  });
}

function cleanup() {
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('Shutting down...');
  if (splitClient) {
    splitClient.destroy();
  }
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

// ========== Main Application ==========

async function main() {
  try {
    // Initialize SDK
    await initializeSplitClient();

    // Clear screen before starting
    process.stdout.write('\x1b[2J\x1b[H');
    console.log('Initializing demo...\n');

    // Refresh function
    const refresh = () => {
      const flags = evaluateFlags();
      draw(flags);
    };

    // Setup SDK_UPDATE listener for immediate flag changes
    setupSDKUpdateListener(refresh);

    // Setup keyboard controls
    setupKeypress(refresh);

    // Initial draw
    refresh();

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

main();
