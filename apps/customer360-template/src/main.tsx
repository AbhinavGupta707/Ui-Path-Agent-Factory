import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { seedCustomerRecords, summarizeCustomer360 } from "@agent-factory/customer360-metrics";
import "./styles.css";

const summary = summarizeCustomer360(seedCustomerRecords);

function App() {
  return (
    <main>
      <header>
        <h1>Customer360 Dashboard</h1>
        <p>Generated dashboard template seeded for the governed build workflow.</p>
      </header>

      <section className="metrics" aria-label="Portfolio metrics">
        <article>
          <span>Total ARR</span>
          <strong>${summary.totalArr.toLocaleString()}</strong>
        </article>
        <article>
          <span>Average health</span>
          <strong>{summary.averageHealthScore}</strong>
        </article>
        <article>
          <span>At-risk accounts</span>
          <strong>{summary.accountsAtRisk}</strong>
        </article>
        <article>
          <span>Expansion candidates</span>
          <strong>{summary.expansionCandidates}</strong>
        </article>
      </section>

      <section className="tableSection" aria-label="Customer accounts">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Segment</th>
              <th>Region</th>
              <th>ARR</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {seedCustomerRecords.map((record) => (
              <tr key={record.account}>
                <td>{record.account}</td>
                <td>{record.segment}</td>
                <td>{record.region}</td>
                <td>${record.arr.toLocaleString()}</td>
                <td>{record.healthScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
