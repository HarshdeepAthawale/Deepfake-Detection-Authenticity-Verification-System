/**
 * Kill processes using specified ports
 * Usage: node scripts/kill-port.js [port1] [port2] ...
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const killPort = async (port) => {
  try {
    // Find process using the port (Windows)
    const { stdout } = await execAsync(`netstat -ano | findstr ":${port}"`);
    
    if (!stdout.trim()) {
      console.log(`Port ${port} is free`);
      return;
    }

    // Extract PIDs from output
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`Port ${port} is free`);
      return;
    }

    // Kill each process
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`Killed process ${pid} using port ${port}`);
      } catch (error) {
        console.log(`Could not kill process ${pid}: ${error.message}`);
      }
    }

    // Verify port is free
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { stdout: check } = await execAsync(`netstat -ano | findstr ":${port}"`);
    if (!check.trim()) {
      console.log(`Port ${port} is now free`);
    } else {
      console.log(`Port ${port} may still be in use`);
    }
  } catch (error) {
    if (error.code === 1) {
      // No process found (netstat returns exit code 1 when findstr finds nothing)
      console.log(`Port ${port} is free`);
    } else {
      console.error(`Error checking port ${port}:`, error.message);
    }
  }
};

// Get ports from command line arguments or use defaults
const ports = process.argv.slice(2).length > 0 
  ? process.argv.slice(2).map(p => parseInt(p))
  : [3001, 3002]; // Default ports

console.log(`Checking ports: ${ports.join(', ')}...\n`);

// Kill processes on all specified ports
Promise.all(ports.map(port => killPort(port)))
  .then(() => {
    console.log('\nAll ports checked and cleared!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

