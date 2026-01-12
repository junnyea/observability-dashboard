const { Tail } = require('tail');
const EventEmitter = require('events');
const fs = require('fs');

class LogTailer extends EventEmitter {
  constructor(services) {
    super();
    this.tails = {};
    this.services = services;
  }

  start() {
    this.services.forEach(service => {
      // Check if log file exists, create if not
      if (!fs.existsSync(service.logFile)) {
        console.log(`Log file not found: ${service.logFile}, waiting for it...`);
        this.watchForFile(service);
        return;
      }

      this.startTailing(service);
    });
  }

  watchForFile(service) {
    const checkInterval = setInterval(() => {
      if (fs.existsSync(service.logFile)) {
        clearInterval(checkInterval);
        this.startTailing(service);
      }
    }, 5000);
  }

  startTailing(service) {
    try {
      const tail = new Tail(service.logFile, {
        follow: true,
        fromBeginning: false,
        useWatchFile: true,
        fsWatchOptions: { interval: 100 }
      });

      tail.on('line', (line) => {
        if (line.trim()) {
          this.emit('log', {
            service: service.name,
            timestamp: new Date().toISOString(),
            raw: line,
            parsed: this.parseLine(line)
          });
        }
      });

      tail.on('error', (err) => {
        console.error(`Tail error for ${service.name}:`, err.message);
        this.emit('error', { service: service.name, error: err });
      });

      this.tails[service.name] = tail;
      console.log(`Started tailing: ${service.logFile}`);
    } catch (err) {
      console.error(`Failed to start tailing ${service.name}:`, err.message);
    }
  }

  parseLine(line) {
    // Try to extract log level from common patterns
    const lowerLine = line.toLowerCase();

    let level = 'info';
    if (lowerLine.includes('error') || lowerLine.includes('err:')) {
      level = 'error';
    } else if (lowerLine.includes('warn')) {
      level = 'warn';
    } else if (lowerLine.includes('debug')) {
      level = 'debug';
    }

    return {
      level,
      message: line
    };
  }

  stop() {
    Object.entries(this.tails).forEach(([name, tail]) => {
      try {
        tail.unwatch();
        console.log(`Stopped tailing: ${name}`);
      } catch (err) {
        console.error(`Error stopping tail for ${name}:`, err.message);
      }
    });
    this.tails = {};
  }

  getStatus() {
    return Object.keys(this.tails).map(name => ({
      service: name,
      active: true
    }));
  }
}

module.exports = LogTailer;
