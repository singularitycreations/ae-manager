# AfterFX Manager
NodeJS module for After Effects process. Starts AfterFX and monitors process status and checks
is AfterFX running via startup file. Default startup file path is `C:\test\AeIsReady.json`. You can
change this while initializing AEManager class, see examples below.

### Usage
```bash
$ npm i @singularitycreations/ae-manager
```

```js
const { AEManager } = require('@singularitycreations/ae-manager');

// AEManager starts AfterFX if it´s not running and starts process monitoring.
// Start with default conf.
const aem = new AEManager();

// or with your conf.
const aem = new AEManager({
    aeBinary = '/full/path/to/AfterFX.exe',
    prName = 'AfterFX.exe', // process name in task manager
    aeRunningCheckFile = '/full/path/to/AeIsReady.json',
});

// AEManager depends on @singularitycreations/process-manager
// Process manager class object if needed
const pm = aem.pm;

(async () => {
    try {
    // wait until AE is ready, startup file found.
    // you can use this function many times.
    await aem.isReady();    

    // your code ...
    } catch (error) {
        console.error(error.message);
    }
})();

```
