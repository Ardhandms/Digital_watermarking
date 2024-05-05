/**
 * console.log()
 */
const originConsoleLog = window.console.log;
window.console.log = function(...data) {
  const time = new Date();
  const timeStr = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
  originConsoleLog(`[${timeStr}]`, ...data);

  const logs = document.querySelector<HTMLTextAreaElement>('#logs textarea');
  if (logs) logs.value += [`[${timeStr}]`, ...data].join(' ') + '\n';
}