export function renderHtml() {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Unsubscribe Tracker</title>
        <link rel="stylesheet" type="text/css" href="https://static.integrations.cloudflare.com/styles.css">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          main { padding-top: 2rem; }
          form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
          input { flex-grow: 1; }
          ul { list-style-type: none; padding: 0; }
          li { display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
          th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <header>
          <h1>Unsubscribe Tracker</h1>
        </header>
        <main>
          <form id="unsub-form">
            <input type="text" id="domain" name="domain" placeholder="example.com" required>
            <button type="submit">Log Unsubscribe</button>
          </form>

          <h2>Stats</h2>
          <table id="stats-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Count</th>
                <th>Latest Unsubscription</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>

          <h2>History</h2>
          <ul id="unsub-list"></ul>
        </main>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('unsub-form');
            const domainInput = document.getElementById('domain');
            const list = document.getElementById('unsub-list');
            const statsTableBody = document.querySelector('#stats-table tbody');

            const fetchStats = async () => {
              const response = await fetch('/api/unsubscriptions/stats');
              const stats = await response.json();
              statsTableBody.innerHTML = '';
              stats.forEach(stat => {
                const tr = document.createElement('tr');
                const domainTd = document.createElement('td');
                domainTd.textContent = stat.domain;
                const countTd = document.createElement('td');
                countTd.textContent = stat.count;
                const dateTd = document.createElement('td');
                dateTd.textContent = new Date(stat.latest_unsubscription).toLocaleString();
                tr.appendChild(domainTd);
                tr.appendChild(countTd);
                tr.appendChild(dateTd);
                statsTableBody.appendChild(tr);
              });
            };

            const fetchUnsubs = async () => {
              const response = await fetch('/api/unsubscriptions');
              const unsubs = await response.json();
              list.innerHTML = '';
              unsubs.forEach(unsub => {
                const li = document.createElement('li');
                const domainSpan = document.createElement('span');
                domainSpan.textContent = unsub.domain;
                const dateSpan = document.createElement('span');
                dateSpan.textContent = new Date(unsub.created_at).toLocaleString();
                li.appendChild(domainSpan);
                li.appendChild(dateSpan);
                list.appendChild(li);
              });
            };

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const domain = domainInput.value;
              await fetch('/api/unsubscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
              });
              domainInput.value = '';
              fetchUnsubs();
              fetchStats();
            });

            fetchUnsubs();
            fetchStats();
          });
        </script>
      </body>
    </html>
  `;
}