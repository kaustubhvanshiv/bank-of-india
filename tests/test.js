const http = require('http');
const { spawn } = require('child_process');

// Ensure server process is always killed on exit
let child;
process.on('exit', () => {
  if (child) {
    child.kill();
  }
});

process.on('SIGINT', () => {
  if (child) {
    child.kill();
  }
  process.exit(1);
});

// Health check function
function performHealthCheck() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);
    
    http.get('http://localhost:5000/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        clearTimeout(timeout);
        resolve(data === 'OK');
      });
    }).on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Start server in background
console.log('STARTING SERVER');
child = spawn('node', ['./app/server.js']);

let testCompleted = false;

// Wait for server startup
setTimeout(async () => {
  if (testCompleted) return;
  
  console.log('CHECKING HEALTH');
  
  // First attempt
  let result = await performHealthCheck();
  
  // Retry once if failed
  if (!result) {
    console.log('First check failed, retrying in 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('CHECKING HEALTH (RETRY)');
    result = await performHealthCheck();
  }
  
  testCompleted = true;
  console.log('STOPPING SERVER');
  if (child) child.kill();
  
  if (result) {
    console.log('TEST PASSED');
    console.log('FINAL RESULT: SUCCESS');
    process.exit(0);
  } else {
    console.log('TEST FAILED');
    console.log('FINAL RESULT: FAILURE');
    process.exit(1);
  }
}, 2000);
