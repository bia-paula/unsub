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
          main { padding-top: 2rem; max-width: 800px; margin: 0 auto; }
          form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; position: relative; }
          .input-container { position: relative; width: 100%; }
          input { width: 100%; padding: 0.5rem; font-size: 1rem; }
          button[type="submit"] { padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button[type="submit"]:hover { background: #0056b3; }
          ul { list-style-type: none; padding: 0; }
          li { display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
          th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #eee; }
          .suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
            display: none;
          }
          .suggestion-item {
            padding: 0.5rem 1rem;
            cursor: pointer;
          }
          .suggestion-item:hover {
            background-color: #f8f9fa;
          }
          .suggestion-item.highlighted {
            background-color: #e9ecef;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Unsubscribe Tracker</h1>
        </header>
        <main>
          <form id="unsub-form">
            <div class="input-container">
              <input type="text" id="domain" name="domain" placeholder="example.com" autocomplete="off" required>
              <div id="suggestions" class="suggestions"></div>
            </div>
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
            const suggestionsContainer = document.getElementById('suggestions');
            let currentFocus = -1;
            let suggestions = [];
            let debounceTimer;

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

            const searchDomains = async (query) => {
              if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
              }
              
              try {
                const response = await fetch('/api/unsubscriptions/search?q=' + encodeURIComponent(query));
                suggestions = await response.json();
                
                if (suggestions.length > 0) {
                  suggestionsContainer.innerHTML = suggestions
                    .map(function(suggestion, index) {
                      return '<div class="suggestion-item' + 
                            (index === currentFocus ? ' highlighted' : '') + 
                            '" data-index="' + index + '">' + 
                            suggestion + 
                            '</div>';
                    })
                    .join('');
                  suggestionsContainer.style.display = 'block';
                } else {
                  suggestionsContainer.style.display = 'none';
                }
              } catch (error) {
                console.error('Error fetching suggestions:', error);
                suggestionsContainer.style.display = 'none';
              }
            };
            
            const addActive = (items) => {
              removeActive(items);
              if (currentFocus >= items.length) currentFocus = 0;
              if (currentFocus < 0) currentFocus = items.length - 1;
              items[currentFocus].classList.add('highlighted');
            };
            
            const removeActive = (items) => {
              items.forEach(item => item.classList.remove('highlighted'));
            };
            
            domainInput.addEventListener('input', (e) => {
              const target = e.target;
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                searchDomains(target.value);
              }, 200);
            });
            
            domainInput.addEventListener('keydown', (e) => {
              const items = suggestionsContainer.querySelectorAll('.suggestion-item');
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                addActive(items);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                addActive(items);
              } else if (e.key === 'Enter' && currentFocus > -1) {
                e.preventDefault();
                const item = items[currentFocus];
                domainInput.value = item.textContent || '';
                suggestionsContainer.style.display = 'none';
              } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
              }
            });
            
            suggestionsContainer.addEventListener('click', (e) => {
              if (e.target.classList.contains('suggestion-item')) {
                domainInput.value = e.target.textContent;
                suggestionsContainer.style.display = 'none';
                domainInput.focus();
              }
            });
            
            document.addEventListener('click', (e) => {
              if (e.target !== domainInput) {
                suggestionsContainer.style.display = 'none';
              }
            });

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const domain = domainInput.value.trim();
              if (!domain) return;
              
              try {
                await fetch('/api/unsubscriptions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ domain })
                });
                domainInput.value = '';
                suggestionsContainer.style.display = 'none';
                await Promise.all([fetchUnsubs(), fetchStats()]);
              } catch (error) {
                console.error('Error adding unsubscription:', error);
                alert('Failed to add unsubscription. Please try again.');
              }
            });

            fetchUnsubs();
            fetchStats();
          });
        </script>
      </body>
    </html>
  `;
}