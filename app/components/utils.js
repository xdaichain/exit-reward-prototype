
// Returns unix timestamp (in UTC) for the current moment.
function getCurrentPoint() {
  const now = new Date;
  return Math.trunc(now.getTime() / 1000);
}

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Returns today's date in the format YYYY-MM-DD.
function today() {
  const now = new Date;
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() - 0 + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns yesterday's date in the format YYYY-MM-DD.
function yesterday() {
  const now = new Date;
  const dayAgo = new Date(now.getTime() - 86400000);
  const year = dayAgo.getUTCFullYear();
  const month = (dayAgo.getUTCMonth() - 0 + 1).toString().padStart(2, '0');
  const day = dayAgo.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  getCurrentPoint,
  sleep,
  today,
  yesterday
}