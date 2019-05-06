/* eslint-disable no-await-in-loop */
const {
  ProcessManager, getDate, timeout, readFile, hasProperty,
} = require('@singularitycreations/process-manager');
const fs = require('fs');
const config = require('../conf/conf.json');

class AEManager {
  constructor({
    aeBinary = config.ae_binary,
    prName = 'AfterFX.exe',
    aeRunningCheckFile = config.ae_running_check_file,
    keepRunningInterval = 30000,
  } = {}) {
    this.aeBinary = aeBinary;
    this.prName = prName;
    this.aeRunningCheckFile = aeRunningCheckFile;

    this.pm = new ProcessManager({
      binaryPath: this.aeBinary,
      prName: this.prName,
    });

    this.pm.keepRunning({
      interval: keepRunningInterval,
      killOldProcess: true,
    });

    this.removeAeRunningCheckFile();
  }

  /**
   * Is After Effect running and ready? Check startup file and process.
   *
   * @returns {Boolean}
   * @author Eignart
   * @since 2019.03.24
   */
  async isReady() {
    let aeProcess = await this.pm.getProcessInfo();
    const aeProcessFile = await readFile(this.aeRunningCheckFile);
    const aeProcFile = (aeProcessFile && aeProcessFile.length ? JSON.parse(aeProcessFile) : null);

    if (aeProcFile && aeProcess.isExist() && aeProcess.PID === aeProcFile.PID) {
      console.log(`[${getDate()}] (AEManager) AfterFX is ready for work.`);
      return true;
    }

    if ((aeProcFile && !aeProcess.isExist())
      || (aeProcFile && aeProcess.isExist() && aeProcess.PID !== aeProcFile.PID)) {
      // eslint-disable-next-line max-len
      console.log(`[${getDate()}] (AEManager) AE is not running, remove check file and start AE again`);
      this.removeAeRunningCheckFile();
    }

    if (!aeProcess.isExist()) {
      this.removeAeRunningCheckFile();
      this.pm.startProcess();
    }

    // wait AE start
    await this.waitAeStart();
    aeProcess = await this.pm.getProcessInfo();
    console.log(`[${getDate()}] (AEManager) AE started, store PID ${aeProcess.PID}`);
    await this.storeAePidToFile(aeProcess.PID);
    await timeout(5000);
    return true;
  }

  /**
   * Wait AE start. Wait until AE starts via startup file.
   *
   * @param {void}
   * @returns {Promise}
   * @author Eignart
   * @since 2019.03.06
   */
  async waitAeStart() {
    // eslint-disable-next-line consistent-return
    return new Promise(async (resolve, reject) => {
      let fileFound = false;
      let checkCount = 0;
      const app = this;
      let i = 0;

      try {
        i = setInterval(async () => {
          const aeProcess = await app.pm.getProcessInfo();

          // if AE process not found then start AE
          if (!aeProcess.isExist()) {
            console.log(`[${getDate()}] (AEManager) Start AfterFX`);
            await app.pm.startProcess();
            return;
          }

          // eslint-disable-next-line no-loop-func, consistent-return
          fs.access(app.aeRunningCheckFile, fs.F_OK, async (err) => {
            if (err) {
              // file not exist, wait more
              return false;
            }

            console.log(`[${getDate()}] (AEManager) AE startup file found, stop waiting.`);
            fileFound = true;
          });

          // wait fs.access result
          await timeout(1000);

          // startup file found
          if (fileFound) {
            resolve();
            clearInterval(i);
          }

          checkCount += 1;

          if (checkCount > 4) {
            console.log(`[${getDate()}] (AEManager) Restart AfterFX, startup file not found.`);
            process.kill(aeProcess.PID);
            checkCount = 0;
          }
        }, 10000);
      } catch (error) {
        console.log(`[${getDate()}] (AEManager) Wait error. ${error}`);
        reject();
        clearInterval(i);
      }
    });
  }

  /**
   * Store PID to AfterFX startup check file.
   *
   * @param {Number} pid Process ID
   * @returns {Promise}
   * @author Eignart
   * @since 2019.03.24
   */
  async storeAePidToFile(pid) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      fs.open(this.aeRunningCheckFile, 'w', (err, fd) => {
        if (err) {
          if (err.code === 'EEXIST') {
            console.error('(AEManager) File already exists');
          }

          return reject(err);
        }

        const data = {
          PID: pid,
        };

        // eslint-disable-next-line consistent-return
        fs.writeFile(fd, JSON.stringify(data), (error) => {
          if (error) {
            return reject(error);
          }

          fs.close(fd, (er) => {
            if (er) {
              return reject(er);
            }

            return resolve(true);
          });
        });
      });
    });
  }

  /**
   * Remove AE running check file.
   *
   * @returns {Promise}
   * @author Eignart
   * @since 2019.03.04
   */
  async removeAeRunningCheckFile() {
    return new Promise((res) => {
      // eslint-disable-next-line consistent-return
      fs.access(this.aeRunningCheckFile, fs.F_OK, (err) => {
        if (err) {
          // console.error('file not exist');
          return res(err);
        }

        // eslint-disable-next-line consistent-return
        fs.unlink(this.aeRunningCheckFile, async (er) => {
          if (er) {
            console.log(`[${getDate()}] (AEManager) File delete failed. ${er}`);
            return res(er);
          }

          return res(true);
        });
      });
    });
  }
}

module.exports = {
  ProcessManager, getDate, timeout, AEManager, readFile, hasProperty,
};
